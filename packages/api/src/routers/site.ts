import { z } from "zod";
import { router, authedProcedure, permissionProcedure } from "../trpc";
import { prisma } from "@nextpress/db";

export const siteRouter = router({
  current: authedProcedure.query(async ({ ctx }) => {
    return prisma.site.findUnique({ where: { id: ctx.auth.siteId } });
  }),
  list: permissionProcedure("manage_sites").query(async () => {
    return prisma.site.findMany({ orderBy: { name: "asc" } });
  }),
  update: permissionProcedure("manage_settings")
    .input(z.object({
      name: z.string().min(1).max(200).optional(),
      tagline: z.string().max(500).optional().nullable(),
      locale: z.string().max(10).optional(),
      timezone: z.string().max(50).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return prisma.site.update({ where: { id: ctx.auth.siteId }, data: input });
    }),
});
