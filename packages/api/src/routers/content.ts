import { z } from "zod";
import {
  router,
  authedProcedure,
  permissionProcedure,
  publicProcedure,
} from "../trpc";
import { contentService } from "@nextpress/core/content/content-service";
import {
  createContentEntrySchema,
  updateContentEntrySchema,
  listContentEntriesSchema,
  statusTransitionSchema,
} from "@nextpress/core/content/content-types";

export const contentRouter = router({
  // ── Public read operations ──

  /** Get a single published entry by slug (public site) */
  getBySlug: publicProcedure
    .input(
      z.object({
        siteId: z.string().cuid(),
        contentTypeSlug: z.string(),
        slug: z.string(),
      }),
    )
    .query(async ({ input }) => {
      return contentService.getBySlug(
        input.siteId,
        input.contentTypeSlug,
        input.slug,
      );
    }),

  // ── Authenticated CRUD ──

  /** Get a single entry by ID (admin) */
  getById: authedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return contentService.getById(ctx.auth.siteId, input.id);
    }),

  /** List entries with filtering and pagination */
  list: authedProcedure
    .input(listContentEntriesSchema)
    .query(async ({ ctx, input }) => {
      return contentService.list(ctx.auth.siteId, input);
    }),

  /** Create a new content entry */
  create: authedProcedure
    .input(createContentEntrySchema)
    .mutation(async ({ ctx, input }) => {
      return contentService.create(ctx.auth, input);
    }),

  /** Update an existing content entry */
  update: authedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        data: updateContentEntrySchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return contentService.update(ctx.auth, input.id, input.data);
    }),

  /** Save as draft (convenience) */
  saveDraft: authedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        data: updateContentEntrySchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return contentService.saveDraft(ctx.auth, input.id, input.data);
    }),

  /** Transition status */
  transition: authedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        ...statusTransitionSchema.shape,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return contentService.transition(ctx.auth, input.id, {
        status: input.status,
        scheduledAt: input.scheduledAt,
      });
    }),

  /** Publish */
  publish: authedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return contentService.publish(ctx.auth, input.id);
    }),

  /** Schedule */
  schedule: authedProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        scheduledAt: z.coerce.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return contentService.schedule(ctx.auth, input.id, input.scheduledAt);
    }),

  /** Archive */
  archive: authedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return contentService.archive(ctx.auth, input.id);
    }),

  /** Move to trash */
  trash: authedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return contentService.trash(ctx.auth, input.id);
    }),

  /** Restore from trash */
  restore: authedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      return contentService.restore(ctx.auth, input.id);
    }),

  /** Permanent delete (only from TRASH) */
  delete: authedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await contentService.delete(ctx.auth, input.id);
      return { success: true };
    }),
});
