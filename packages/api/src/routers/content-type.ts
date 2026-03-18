import { z } from "zod";
import {
  router,
  authedProcedure,
  permissionProcedure,
} from "../trpc";
import { contentTypeService } from "@nextpress/core/content-type/content-type-service";
import {
  createContentTypeSchema,
  updateContentTypeSchema,
} from "@nextpress/core/content-type/content-type-types";

export const contentTypeRouter = router({
  /** List all content types for the current site */
  list: authedProcedure.query(async ({ ctx }) => {
    return contentTypeService.list(ctx.auth.siteId);
  }),

  /** Get a content type by slug */
  getBySlug: authedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      return contentTypeService.getBySlug(ctx.auth.siteId, input.slug);
    }),

  /** Create a new content type */
  create: permissionProcedure("manage_content_types")
    .input(createContentTypeSchema)
    .mutation(async ({ ctx, input }) => {
      return contentTypeService.create(ctx.auth, input);
    }),

  /** Update a content type */
  update: permissionProcedure("manage_content_types")
    .input(
      z.object({
        id: z.string().cuid(),
        data: updateContentTypeSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return contentTypeService.update(ctx.auth, input.id, input.data);
    }),

  /** Delete a content type */
  delete: permissionProcedure("manage_content_types")
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await contentTypeService.delete(ctx.auth, input.id);
      return { success: true };
    }),
});
