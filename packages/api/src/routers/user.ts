import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { prisma } from "@nextpress/db";
import {
  router,
  authedProcedure,
  permissionProcedure,
} from "../trpc";

/**
 * User router — demonstrates the permission middleware pattern.
 *
 * Each procedure uses the appropriate permission level:
 *   - me:     any authenticated user (own profile)
 *   - list:   requires "list_users"
 *   - create: requires "create_users"
 *   - delete: requires "delete_users"
 */
export const userRouter = router({
  /** Get current user's own profile */
  me: authedProcedure.query(async ({ ctx }) => {
    const user = await prisma.user.findUnique({
      where: { id: ctx.auth.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        displayName: true,
        image: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    return { ...user, role: ctx.auth.role };
  }),

  /** List users on the current site */
  list: permissionProcedure("list_users")
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        perPage: z.number().int().min(1).max(100).default(20),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, perPage, search } = input;
      const skip = (page - 1) * perPage;

      const where = {
        sites: {
          some: { siteId: ctx.auth.siteId },
        },
        ...(search
          ? {
              OR: [
                { email: { contains: search, mode: "insensitive" as const } },
                { name: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {}),
      };

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: perPage,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            email: true,
            name: true,
            displayName: true,
            image: true,
            createdAt: true,
            sites: {
              where: { siteId: ctx.auth.siteId },
              select: {
                role: { select: { slug: true, name: true } },
              },
            },
          },
        }),
        prisma.user.count({ where }),
      ]);

      return {
        users: users.map((u) => ({
          ...u,
          role: u.sites[0]?.role ?? null,
          sites: undefined,
        })),
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
      };
    }),

  /** Create a new user on the current site */
  create: permissionProcedure("create_users")
    .input(
      z.object({
        email: z.string().email(),
        name: z.string().min(1).max(200),
        roleSlug: z.string(),
        password: z.string().min(8).max(128).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { hash } = await import("bcryptjs");
      const { BCRYPT_ROUNDS } = await import(
        "@nextpress/core/auth/auth-config"
      );

      const role = await prisma.role.findUnique({
        where: { slug: input.roleSlug },
      });
      if (!role) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Role "${input.roleSlug}" not found`,
        });
      }

      // Prevent privilege escalation
      if (
        input.roleSlug === "admin" &&
        ctx.auth.role !== "super_admin" &&
        ctx.auth.role !== "admin"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can create admin users",
        });
      }

      const passwordHash = input.password
        ? await hash(input.password, BCRYPT_ROUNDS)
        : null;

      const user = await prisma.user.create({
        data: {
          email: input.email.toLowerCase().trim(),
          name: input.name,
          passwordHash,
          sites: {
            create: {
              siteId: ctx.auth.siteId,
              roleId: role.id,
            },
          },
        },
        select: { id: true, email: true, name: true },
      });

      return user;
    }),

  /** Remove a user from the current site */
  delete: permissionProcedure("delete_users")
    .input(z.object({ userId: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.auth.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete your own account",
        });
      }

      await prisma.userSite.delete({
        where: {
          userId_siteId: {
            userId: input.userId,
            siteId: ctx.auth.siteId,
          },
        },
      });

      return { success: true };
    }),
});
