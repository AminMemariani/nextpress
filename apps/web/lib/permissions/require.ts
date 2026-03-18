import "server-only";

import { requireAuthContext } from "../auth/session";
import type {
  PermissionSlug,
  ResourceContext,
} from "@nextpress/core/auth/auth-types";
import { assertCan } from "@nextpress/core/auth/permissions";

// ============================================================================
// Permission Assertions — for server actions and API routes
// ============================================================================
// These throw AuthorizationError on failure (caught by error boundaries
// or tRPC error handlers). Unlike guards (which redirect), these are for
// non-page contexts where a redirect doesn't make sense.
// ============================================================================

/**
 * Assert the current user has a specific permission.
 * Throws AuthenticationError or AuthorizationError.
 *
 * @example
 *   // In a server action:
 *   async function deletePost(id: string) {
 *     "use server";
 *     const auth = await assertPermission("delete_others_content");
 *     await contentService.delete(auth.siteId, id);
 *   }
 */
export async function assertPermission(
  permission: PermissionSlug,
  resource?: ResourceContext,
) {
  const auth = await requireAuthContext();
  assertCan(auth, permission, resource);
  return auth;
}

/**
 * Assert the current user has ALL of the given permissions.
 */
export async function assertAllPermissions(
  permissions: PermissionSlug[],
) {
  const auth = await requireAuthContext();
  for (const perm of permissions) {
    assertCan(auth, perm);
  }
  return auth;
}

/**
 * Assert the current user has at least ONE of the given permissions.
 */
export async function assertAnyPermission(
  permissions: PermissionSlug[],
) {
  const auth = await requireAuthContext();

  // super_admin passes
  if (auth.role === "super_admin") return auth;

  const hasAny = permissions.some((p) => auth.permissions.has(p));
  if (!hasAny) {
    const { AuthorizationError } = await import(
      "@nextpress/core/errors/cms-error"
    );
    throw new AuthorizationError(
      `Requires one of: ${permissions.join(", ")}`,
    );
  }

  return auth;
}
