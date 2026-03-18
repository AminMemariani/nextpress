import "server-only";

import { getAuthContext } from "../auth/session";
import type {
  AuthContext,
  PermissionSlug,
} from "@nextpress/core/auth/auth-types";
import {
  can,
  canCreateContent,
  canEditContent,
  canDeleteContent,
  canPublishContent,
  canUploadMedia,
  canModerateComments,
  canManageUsers,
  canManageSettings,
  canManagePlugins,
  canManageAppearance,
} from "@nextpress/core/auth/permissions";

// ============================================================================
// Permission Check Helpers — for conditional UI in server components
// ============================================================================
// Unlike guards (which redirect), these return booleans.
// Use them for showing/hiding UI elements:
//
//   const canEdit = await checkPermission("edit_others_content");
//   return (
//     <div>
//       {canEdit && <EditButton />}
//     </div>
//   );
// ============================================================================

/**
 * Check if the current user has a specific permission.
 * Returns false if not authenticated.
 */
export async function checkPermission(
  permission: PermissionSlug,
): Promise<boolean> {
  const auth = await getAuthContext();
  if (!auth) return false;
  return can(auth, permission).granted;
}

/**
 * Check multiple permissions, returning a map.
 * Single DB query for the auth context, then pure checks.
 *
 * @example
 *   const perms = await checkPermissions([
 *     "create_content",
 *     "publish_content",
 *     "manage_settings",
 *   ]);
 *   if (perms.create_content) { ... }
 */
export async function checkPermissions<T extends PermissionSlug>(
  permissions: T[],
): Promise<Record<T, boolean>> {
  const auth = await getAuthContext();
  const result = {} as Record<T, boolean>;

  for (const perm of permissions) {
    result[perm] = auth ? can(auth, perm).granted : false;
  }

  return result;
}

/**
 * Get a structured permission summary for the current user.
 * Useful for admin layouts that conditionally render nav items.
 */
export async function getPermissionSummary() {
  const auth = await getAuthContext();
  if (!auth) {
    return {
      authenticated: false as const,
      role: null,
      canCreateContent: false,
      canEditOthersContent: false,
      canPublishContent: false,
      canUploadMedia: false,
      canModerateComments: false,
      canManageUsers: false,
      canManageSettings: false,
      canManagePlugins: false,
      canManageAppearance: false,
    };
  }

  return {
    authenticated: true as const,
    role: auth.role,
    canCreateContent: canCreateContent(auth).granted,
    canEditOthersContent: can(auth, "edit_others_content").granted,
    canPublishContent: canPublishContent(auth).granted,
    canUploadMedia: canUploadMedia(auth).granted,
    canModerateComments: canModerateComments(auth).granted,
    canManageUsers: canManageUsers(auth).granted,
    canManageSettings: canManageSettings(auth).granted,
    canManagePlugins: canManagePlugins(auth).granted,
    canManageAppearance: canManageAppearance(auth).granted,
  };
}

// Re-export the core permission functions for use with an explicit AuthContext
// (e.g., in tRPC procedures where you already have the context).
export {
  can,
  canCreateContent,
  canEditContent,
  canDeleteContent,
  canPublishContent,
  canUploadMedia,
  canModerateComments,
  canManageUsers,
  canManageSettings,
  canManagePlugins,
  canManageAppearance,
} from "@nextpress/core/auth/permissions";
