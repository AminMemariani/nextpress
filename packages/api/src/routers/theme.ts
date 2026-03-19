import { z } from "zod";
import { router, authedProcedure, permissionProcedure } from "../trpc";
import { themeManager } from "@nextpress/core/theme/theme-manager";
import { prisma } from "@nextpress/db";

export const themeRouter = router({
  list: authedProcedure.query(async ({ ctx }) => {
    const discovered = themeManager.getDiscovered();
    const installs = await prisma.themeInstall.findMany({ where: { siteId: ctx.auth.siteId } });
    const installMap = new Map(installs.map((i) => [i.slug, i]));
    return discovered.map((d) => ({
      slug: d.slug, name: d.manifest.name, version: d.manifest.version,
      description: d.manifest.description, author: d.manifest.author,
      isActive: installMap.get(d.slug)?.isActive ?? false,
      supports: d.manifest.supports,
    }));
  }),
  activate: permissionProcedure("switch_themes")
    .input(z.object({ slug: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.themeInstall.updateMany({ where: { siteId: ctx.auth.siteId, isActive: true }, data: { isActive: false } });
      await prisma.themeInstall.upsert({
        where: { siteId_slug: { siteId: ctx.auth.siteId, slug: input.slug } },
        update: { isActive: true, activatedAt: new Date() },
        create: { siteId: ctx.auth.siteId, slug: input.slug, version: "1.0.0", isActive: true, activatedAt: new Date() },
      });
      themeManager.reset();
      return { success: true };
    }),
  getCustomizations: authedProcedure.query(async ({ ctx }) => {
    const install = await prisma.themeInstall.findFirst({ where: { siteId: ctx.auth.siteId, isActive: true } });
    return (install?.customizations ?? {}) as Record<string, unknown>;
  }),
  updateCustomizations: permissionProcedure("customize_theme")
    .input(z.object({ customizations: z.record(z.unknown()) }))
    .mutation(async ({ ctx, input }) => {
      await prisma.themeInstall.updateMany({ where: { siteId: ctx.auth.siteId, isActive: true }, data: { customizations: input.customizations } });
      return { success: true };
    }),
});
