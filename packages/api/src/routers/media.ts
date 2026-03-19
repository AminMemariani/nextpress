import { z } from "zod";
import {
  router,
  authedProcedure,
  permissionProcedure,
} from "../trpc";
import { mediaService } from "@nextpress/core/media/media-service";
import {
  updateMediaSchema,
  listMediaSchema,
} from "@nextpress/core/media/media-types";

export const mediaRouter = router({
  /** List media assets (paginated, filterable) */
  list: authedProcedure
    .input(listMediaSchema)
    .query(async ({ ctx, input }) => {
      return mediaService.list(ctx.auth.siteId, input);
    }),

  /** Get a single media asset */
  getById: authedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return mediaService.getById(ctx.auth.siteId, input.id);
    }),

  /** Update media metadata */
  update: permissionProcedure("upload_media")
    .input(z.object({
      id: z.string().cuid(),
      data: updateMediaSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      return mediaService.update(ctx.auth, input.id, input.data);
    }),

  /** Delete a media asset */
  delete: permissionProcedure("delete_media")
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await mediaService.delete(ctx.auth, input.id);
      return { success: true };
    }),
});
