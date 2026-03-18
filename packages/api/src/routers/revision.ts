import { z } from "zod";
import { router, authedProcedure } from "../trpc";
import { revisionService } from "@nextpress/core/revision/revision-service";

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

  /** Restore a revision */
  restore: authedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return revisionService.restore(input.id, ctx.auth.user.id);
    }),
});
