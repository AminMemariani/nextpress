/**
 * Scheduled Publishing
 *
 * Finds entries with status SCHEDULED where scheduledAt <= now,
 * and transitions them to PUBLISHED.
 *
 * Invoked by:
 *   - A cron endpoint (/api/revalidate or a dedicated /api/cron/publish)
 *   - Vercel Cron, Railway Cron, or system crontab
 *   - Runs every minute in production
 */

import { prisma } from "@nextpress/db";

export const scheduler = {
  /** Publish all entries whose scheduledAt has passed */
  async publishScheduledEntries(): Promise<{
    published: number;
    ids: string[];
  }> {
    const now = new Date();

    const entries = await prisma.contentEntry.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { lte: now },
      },
      select: { id: true, title: true, siteId: true },
    });

    if (entries.length === 0) {
      return { published: 0, ids: [] };
    }

    const ids = entries.map((e) => e.id);

    await prisma.contentEntry.updateMany({
      where: { id: { in: ids } },
      data: {
        status: "PUBLISHED",
        publishedAt: now,
      },
    });

    return { published: entries.length, ids };
  },
};
