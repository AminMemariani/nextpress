import { z } from "zod";
import { router, publicProcedure, authedProcedure } from "../trpc";
import { searchService } from "@nextpress/core/search/search-service";
import { searchInputSchema } from "@nextpress/core/search/search-types";

export const searchRouter = router({
  /** Public site search — only published content */
  public: publicProcedure
    .input(searchInputSchema.omit({ status: true, authorId: true }))
    .query(async ({ input, ctx }) => {
      const siteId = ctx.auth?.siteId;
      if (!siteId) throw new Error("Site context required");
      return searchService.search(siteId, { ...input, status: "PUBLISHED" });
    }),

  /** Admin search — all content, all statuses */
  admin: authedProcedure
    .input(searchInputSchema)
    .query(async ({ ctx, input }) => {
      return searchService.search(ctx.auth.siteId, input);
    }),
});
