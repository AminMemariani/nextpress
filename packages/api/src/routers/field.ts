import { z } from "zod";
import {
  router,
  authedProcedure,
  permissionProcedure,
} from "../trpc";
import { fieldService } from "@nextpress/core/fields/field-service";
import {
  createFieldDefinitionSchema,
  updateFieldDefinitionSchema,
} from "@nextpress/core/fields/field-types";

export const fieldRouter = router({
  /** List fields for a content type */
  listByContentType: authedProcedure
    .input(z.object({ contentTypeId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return fieldService.listByContentType(
        ctx.auth.siteId,
        input.contentTypeId,
      );
    }),

  /** Create a field definition */
  create: permissionProcedure("manage_fields")
    .input(createFieldDefinitionSchema)
    .mutation(async ({ ctx, input }) => {
      return fieldService.create(ctx.auth, input);
    }),

  /** Update a field definition */
  update: permissionProcedure("manage_fields")
    .input(
      z.object({
        id: z.string().cuid(),
        data: updateFieldDefinitionSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return fieldService.update(ctx.auth, input.id, input.data);
    }),

  /** Delete a field definition */
  delete: permissionProcedure("manage_fields")
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await fieldService.delete(ctx.auth, input.id);
      return { success: true };
    }),
});
