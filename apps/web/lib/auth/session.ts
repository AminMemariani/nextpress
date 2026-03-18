import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import { auth } from "./config";
import { prisma } from "@nextpress/db";
import { resolveSite } from "../site/resolve";
import type {
  AuthContext,
  PermissionSlug,
  RoleSlug,
  SessionUser,
} from "@nextpress/core/auth/auth-types";

// ────────────────────────────────────────────────────────────
// Session access
// ────────────────────────────────────────────────────────────

/**
 * Get the current session user (from JWT).
 * Returns null if not authenticated.
 *
 * Cached per-request via React `cache()`.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;

  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? null,
    displayName: (session.user as SessionUser).displayName ?? null,
    image: session.user.image ?? null,
  };
});

// ────────────────────────────────────────────────────────────
// Auth context resolution
// ────────────────────────────────────────────────────────────

/**
 * Build the full AuthContext for the current request.
 *
 * This resolves the user's role and permissions for the current site
 * by querying the UserSite join table. It is NOT cached in the JWT
 * because a user can have different roles on different sites.
 *
 * Returns null if:
 *   - User is not authenticated
 *   - User has no role on the current site
 *   - Site cannot be resolved
 *
 * Cached per-request via React `cache()`.
 */
export const getAuthContext = cache(
  async (): Promise<AuthContext | null> => {
    const user = await getCurrentUser();
    if (!user) return null;

    const h = await headers();
    const site = await resolveSite(h);
    if (!site) return null;

    // Fetch user's role on this site, with permissions
    const userSite = await prisma.userSite.findUnique({
      where: {
        userId_siteId: { userId: user.id, siteId: site.id },
      },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    if (!userSite) return null;

    const roleSlug = userSite.role.slug as RoleSlug;
    const permissions = new Set<PermissionSlug>(
      userSite.role.permissions.map(
        (rp) => rp.permission.slug as PermissionSlug,
      ),
    );

    return {
      user,
      siteId: site.id,
      role: roleSlug,
      permissions,
    };
  },
);

/**
 * Get AuthContext, throwing if not authenticated or not authorized
 * for the current site. Use in admin server components and server actions.
 */
export async function requireAuthContext(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    // This import is dynamic to avoid circular deps at module level
    const { AuthenticationError } = await import(
      "@nextpress/core/errors/cms-error"
    );
    throw new AuthenticationError();
  }
  return ctx;
}
