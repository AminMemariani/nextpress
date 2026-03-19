import { z } from "zod";
import {
  router,
  authedProcedure,
  permissionProcedure,
  publicProcedure,
} from "../trpc";
import { menuService } from "@nextpress/core/menu/menu-service";
import { saveMenuSchema } from "@nextpress/core/menu/menu-types";

export const menuRouter = router({
  /** Public: get menu by location (for frontend rendering) */
  getByLocation: publicProcedure
    .input(z.object({ siteId: z.string().cuid(), location: z.string() }))
    .query(async ({ input }) => {
      return menuService.getByLocation(input.siteId, input.location);
    }),

  /** Admin: list all menus for the current site */
  list: authedProcedure.query(async ({ ctx }) => {
    return menuService.list(ctx.auth.siteId);
  }),

  /** Admin: get available menu locations */
  locations: authedProcedure.query(async ({ ctx }) => {
    return menuService.getLocations(ctx.auth.siteId);
  }),

  /** Admin: save (create or replace) a menu */
  save: permissionProcedure("manage_menus")
    .input(saveMenuSchema)
    .mutation(async ({ ctx, input }) => {
      return menuService.save(ctx.auth, input);
    }),

  /** Admin: delete a menu */
  delete: permissionProcedure("manage_menus")
    .input(z.object({ location: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await menuService.delete(ctx.auth, input.location);
      return { success: true };
    }),
});
