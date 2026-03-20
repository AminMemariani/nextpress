import { z } from "zod";
import { router, authedProcedure } from "../trpc";
import { revisionService } from "@nextpress/core/revision/revision-service";
import { compareRevisions, buildRevisionDiff } from "@nextpress/core/revision/revision-diff";

export const revisionRouter = router({
  /** List revisions for a content entry */
  list: authedProcedure
    .input(z.object({ contentEntryId: z.string().cuid() }))
    .query(async ({ input }) => {
      return revisionService.list(input.contentEntryId);
    }),

  /** Get a single revision */
  getById: authedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ input }) => {
      return revisionService.getById(input.id);
    }),

  /** Compare two revisions (diff) */
  compare: authedProcedure
    .input(
      z.object({
        olderRevisionId: z.string().cuid(),
        newerRevisionId: z.string().cuid(),
      }),
    )
    .query(async ({ input }) => {
      const older = await revisionService.getById(input.olderRevisionId);
      const newer = await revisionService.getById(input.newerRevisionId);
      return compareRevisions(older, newer);
    }),

  /** Get diff between a revision and the one before it */
  diff: authedProcedure
    .input(z.object({ revisionId: z.string().cuid() }))
    .query(async ({ input }) => {
      const revision = await revisionService.getById(input.revisionId);
      const allRevisions = await revisionService.list(revision.contentEntryId);

      // Find the revision immediately before this one
      const currentIdx = allRevisions.findIndex((r) => r.id === input.revisionId);
      if (currentIdx < 0 || currentIdx >= allRevisions.length - 1) {
        // First revision or not found — no diff available
        return {
          fromVersion: 0,
          toVersion: revision.version,
          fromDate: revision.createdAt,
          toDate: revision.createdAt,
          fromAuthor: revision.author,
          toAuthor: revision.author,
          changes: [
            { field: "title", label: "Title", type: "added" as const, before: null, after: revision.title },
            { field: "blocks", label: "Content", type: "added" as const, before: null, after: `${revision.blocks.length} blocks` },
          ],
          summary: "Initial version",
        };
      }

      const older = allRevisions[currentIdx + 1]!; // list is newest-first
      return compareRevisions(older, revision);
    }),

  /** Restore a revision */
  restore: authedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return revisionService.restore(input.id, ctx.auth.user.id);
    }),
});
