import { TRPCError } from "@trpc/server";
import { initTRPC } from "@trpc/server";
import type { AuthedTrpcContext } from "../context";

/**
 * Site-scoping middleware for tRPC.
 *
 * Ensures the authed user's siteId is injected into every query.
 * Prevents cross-site data access — defense in depth on top of
 * the Prisma site-scoped extension.
 */
export function createSiteScopeMiddleware(
  t: ReturnType<typeof initTRPC.context<AuthedTrpcContext>["create"]>,
) {
  return t.middleware(({ ctx, next }) => {
    if (!ctx.auth.siteId) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No site context available",
      });
    }

    return next({
      ctx: {
        ...ctx,
        siteId: ctx.auth.siteId,
      },
    });
  });
}
