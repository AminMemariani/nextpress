import { z } from "zod";
import { router, authedProcedure, permissionProcedure, publicProcedure } from "../trpc";
import { taxonomyService } from "@nextpress/core/taxonomy/taxonomy-service";
import { createTaxonomySchema, createTermSchema, updateTermSchema } from "@nextpress/core/taxonomy/taxonomy-types";

export const taxonomyRouter = router({
  list: authedProcedure.query(async ({ ctx }) => {
    return taxonomyService.list(ctx.auth.siteId);
  }),
  getBySlug: publicProcedure
    .input(z.object({ siteId: z.string().cuid(), slug: z.string() }))
    .query(async ({ input }) => taxonomyService.getBySlug(input.siteId, input.slug)),
  create: permissionProcedure("manage_taxonomies")
    .input(createTaxonomySchema)
    .mutation(async ({ ctx, input }) => taxonomyService.create(ctx.auth, input)),
  delete: permissionProcedure("manage_taxonomies")
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => { await taxonomyService.delete(ctx.auth, input.id); return { success: true }; }),
  listTerms: authedProcedure
    .input(z.object({ taxonomyId: z.string().cuid() }))
    .query(async ({ input }) => taxonomyService.listTerms(input.taxonomyId)),
  createTerm: permissionProcedure("manage_categories")
    .input(createTermSchema)
    .mutation(async ({ ctx, input }) => taxonomyService.createTerm(ctx.auth, input)),
  updateTerm: permissionProcedure("manage_categories")
    .input(z.object({ id: z.string().cuid(), data: updateTermSchema }))
    .mutation(async ({ ctx, input }) => taxonomyService.updateTerm(ctx.auth, input.id, input.data)),
  deleteTerm: permissionProcedure("manage_categories")
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => { await taxonomyService.deleteTerm(ctx.auth, input.id); return { success: true }; }),
});
