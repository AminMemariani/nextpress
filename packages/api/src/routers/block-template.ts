import { z } from "zod";
import { router, authedProcedure, permissionProcedure } from "../trpc";
import { prisma } from "@nextpress/db";
import { blockDataSchema } from "@nextpress/core/validation/schemas";

export const blockTemplateRouter = router({
  list: authedProcedure
    .input(z.object({ category: z.string().optional(), mode: z.enum(["REUSABLE", "PATTERN"]).optional() }).optional())
    .query(async ({ ctx, input }) => {
      const where: any = { siteId: ctx.auth.siteId };
      if (input?.category) where.category = input.category;
      if (input?.mode) where.mode = input.mode;
      return prisma.blockTemplate.findMany({ where, orderBy: { title: "asc" } });
    }),
  getById: authedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      return prisma.blockTemplate.findFirst({ where: { id: input.id, siteId: ctx.auth.siteId } });
    }),
  create: authedProcedure
    .input(z.object({
      slug: z.string().min(1),
      title: z.string().min(1),
      description: z.string().optional(),
      blocks: z.array(blockDataSchema),
      category: z.string().default("uncategorized"),
      mode: z.enum(["REUSABLE", "PATTERN"]).default("PATTERN"),
    }))
    .mutation(async ({ ctx, input }) => {
      return prisma.blockTemplate.create({
        data: { siteId: ctx.auth.siteId, ...input },
      });
    }),
  update: authedProcedure
    .input(z.object({
      id: z.string().cuid(),
      title: z.string().optional(),
      description: z.string().optional(),
      blocks: z.array(blockDataSchema).optional(),
      category: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return prisma.blockTemplate.update({ where: { id }, data });
    }),
  delete: authedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      await prisma.blockTemplate.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
