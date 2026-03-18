import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

import type { TrpcContext, AuthedTrpcContext } from "./context";
import type { PermissionSlug } from "@nextpress/core/auth/auth-types";
import { can } from "@nextpress/core/auth/permissions";

/**
 * tRPC initialization with superjson transformer (handles Date, Set, Map, etc.)
 */
const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

// ────────────────────────────────────────────────────────────
// Auth middleware
// ────────────────────────────────────────────────────────────

/**
 * Middleware: require authentication.
 * Throws UNAUTHORIZED if no session or no auth context.
 */
const enforceAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.auth) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  }

  return next({
    ctx: ctx as AuthedTrpcContext,
  });
});

/**
 * Procedure that requires authentication.
 * The context is guaranteed to have `session` and `auth`.
 */
export const authedProcedure = t.procedure.use(enforceAuth);

// ────────────────────────────────────────────────────────────
// Permission middleware factory
// ────────────────────────────────────────────────────────────

/**
 * Create a procedure that requires a specific permission.
 *
 * @example
 *   const manageUsersProcedure = permissionProcedure("edit_users");
 *
 *   export const userRouter = router({
 *     list: manageUsersProcedure.query(async ({ ctx }) => {
 *       // ctx.auth is guaranteed to have "edit_users" permission
 *     }),
 *   });
 */
export function permissionProcedure(permission: PermissionSlug) {
  return authedProcedure.use(({ ctx, next }) => {
    const result = can(ctx.auth, permission);
    if (!result.granted) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: result.reason,
      });
    }
    return next({ ctx });
  });
}

/**
 * Create a procedure that requires ANY of the given permissions.
 */
export function anyPermissionProcedure(permissions: PermissionSlug[]) {
  return authedProcedure.use(({ ctx, next }) => {
    // super_admin bypasses
    if (ctx.auth.role === "super_admin") {
      return next({ ctx });
    }

    const hasAny = permissions.some((p) => can(ctx.auth, p).granted);
    if (!hasAny) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `Requires one of: ${permissions.join(", ")}`,
      });
    }
    return next({ ctx });
  });
}
