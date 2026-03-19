/**
 * Scheduled Publishing
 *
 * Finds entries with status SCHEDULED where scheduledAt <= now,
 * and transitions them to PUBLISHED.
 *
 * Also handles:
 *   - Firing content:published hook on each published entry
 *   - Firing content:status_change hook
 *   - Cache revalidation (via hook)
 *
 * Invoked by:
 *   - /api/cron/publish (Vercel Cron, Railway Cron, or system crontab)
 *   - Runs every minute in production
 */

import { prisma } from "@nextpress/db";
import { hooks } from "../hooks/hook-engine";

export interface PublishResult {
  published: number;
  ids: string[];
  errors: Array<{ id: string; error: string }>;
}

export const scheduler = {
  /** Publish all entries whose scheduledAt has passed */
  async publishScheduledEntries(): Promise<PublishResult> {
    const now = new Date();
    const errors: PublishResult["errors"] = [];

    const entries = await prisma.contentEntry.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { lte: now },
      },
      select: {
        id: true,
        title: true,
        siteId: true,
        contentType: { select: { slug: true, nameSingular: true } },
      },
    });

    if (entries.length === 0) {
      return { published: 0, ids: [], errors: [] };
    }

    const publishedIds: string[] = [];

    // Publish one at a time so hooks fire per entry
    // and individual failures don't block others
    for (const entry of entries) {
      try {
        await prisma.contentEntry.update({
          where: { id: entry.id },
          data: {
            status: "PUBLISHED",
            publishedAt: now,
          },
        });

        publishedIds.push(entry.id);

        // Fire lifecycle hooks
        try {
          const fullEntry = await prisma.contentEntry.findUnique({
            where: { id: entry.id },
            include: {
              contentType: { select: { id: true, slug: true, nameSingular: true } },
              author: { select: { id: true, name: true, displayName: true, image: true } },
            },
          });

          if (fullEntry) {
            await hooks.doAction("content:status_change", fullEntry as any, "SCHEDULED", "PUBLISHED");
            await hooks.doAction("content:published", fullEntry as any);
          }
        } catch (hookError) {
          // Hook errors don't prevent publishing
          console.warn(`[Scheduler] Hook error for entry ${entry.id}:`, hookError);
        }
      } catch (e: any) {
        errors.push({ id: entry.id, error: e.message ?? "Unknown error" });
      }
    }

    if (publishedIds.length > 0) {
      console.log(
        `[Scheduler] Published ${publishedIds.length} entries: ${entries
          .filter((e) => publishedIds.includes(e.id))
          .map((e) => e.title)
          .join(", ")}`,
      );
    }

    return { published: publishedIds.length, ids: publishedIds, errors };
  },

  /** Prune old revisions across all entries (maintenance task) */
  async pruneAllRevisions(keepCount: number = 25): Promise<number> {
    // Find entries with more than keepCount revisions
    const entries = await prisma.$queryRaw<Array<{ contentEntryId: string; count: bigint }>>`
      SELECT "contentEntryId", COUNT(*) as count
      FROM revisions
      GROUP BY "contentEntryId"
      HAVING COUNT(*) > ${keepCount}
    `;

    let totalPruned = 0;

    for (const entry of entries) {
      const revisions = await prisma.revision.findMany({
        where: { contentEntryId: entry.contentEntryId },
        orderBy: { version: "desc" },
        select: { id: true },
      });

      const toDelete = revisions.slice(keepCount).map((r) => r.id);
      if (toDelete.length > 0) {
        const { count } = await prisma.revision.deleteMany({
          where: { id: { in: toDelete } },
        });
        totalPruned += count;
      }
    }

    if (totalPruned > 0) {
      console.log(`[Scheduler] Pruned ${totalPruned} old revisions`);
    }

    return totalPruned;
  },
};
