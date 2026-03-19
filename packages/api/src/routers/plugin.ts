import { z } from "zod";
import {
  router,
  authedProcedure,
  permissionProcedure,
} from "../trpc";
import { pluginManager } from "@nextpress/core/plugin/plugin-manager";

export const pluginRouter = router({
  /** List all discovered + installed plugins */
  list: authedProcedure.query(async ({ ctx }) => {
    const discovered = pluginManager.getDiscovered();
    const states = await pluginManager.getState(ctx.auth.siteId);
    const stateMap = new Map(states.map((s) => [s.slug, s]));

    return discovered.map((d) => ({
      slug: d.slug,
      name: d.manifest.name,
      description: d.manifest.description,
      version: d.manifest.version,
      author: d.manifest.author,
      isActive: stateMap.get(d.slug)?.isActive ?? false,
      dependencies: d.manifest.dependencies,
      permissions: d.manifest.permissions.map((p) => p.slug),
    }));
  }),

  /** Activate a plugin */
  activate: permissionProcedure("activate_plugins")
    .input(z.object({ slug: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await pluginManager.activate(input.slug, ctx.auth);
      return { success: true };
    }),

  /** Deactivate a plugin */
  deactivate: permissionProcedure("activate_plugins")
    .input(z.object({ slug: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await pluginManager.deactivate(input.slug, ctx.auth);
      return { success: true };
    }),

  /** Uninstall a plugin */
  uninstall: permissionProcedure("manage_plugins")
    .input(z.object({ slug: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await pluginManager.uninstall(input.slug, ctx.auth);
      return { success: true };
    }),

  /** Get/update plugin settings */
  getSettings: permissionProcedure("manage_plugins")
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const loaded = pluginManager.getLoaded(input.slug);
      if (!loaded) return { settings: {}, schema: {} };

      const state = await pluginManager.getState(ctx.auth.siteId);
      const pluginState = state.find((s) => s.slug === input.slug);

      return {
        settings: pluginState?.settings ?? {},
        schema: loaded.manifest.settings,
      };
    }),

  updateSettings: permissionProcedure("manage_plugins")
    .input(z.object({
      slug: z.string(),
      settings: z.record(z.unknown()),
    }))
    .mutation(async ({ ctx, input }) => {
      const { prisma } = await import("@nextpress/db");
      await prisma.pluginInstall.updateMany({
        where: { slug: input.slug, siteId: ctx.auth.siteId },
        data: { settings: input.settings },
      });
      return { success: true };
    }),
});
