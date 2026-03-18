// ============================================================================
// Permission Checking Engine
// ============================================================================
// Pure functions. No DB access. No side effects.
// Operates on the AuthContext that was already resolved from the DB.
//
// Ownership-aware: "edit_own_content" means the user can edit content
// they authored. "edit_others_content" means they can edit anyone's.
// The check functions accept an optional ResourceContext to evaluate this.
//
// The `can()` function is the single entry point. Everything else
// (canEditContent, canPublishContent, etc.) is a named shortcut.
// ============================================================================

import type {
  AuthContext,
  PermissionResult,
  PermissionSlug,
  ResourceContext,
} from "./auth-types";
import {
  AuthenticationError,
  AuthorizationError,
} from "../errors/cms-error";

// ────────────────────────────────────────────────────────────
// Core check
// ────────────────────────────────────────────────────────────

/**
 * Check if the auth context has a specific permission.
 * super_admin bypasses all checks.
 */
export function can(
  auth: AuthContext,
  permission: PermissionSlug,
  resource?: ResourceContext,
): PermissionResult {
  // super_admin: grant everything
  if (auth.role === "super_admin") {
    return { granted: true };
  }

  // Direct permission check
  if (!auth.permissions.has(permission)) {
    return {
      granted: false,
      reason: `Role "${auth.role}" lacks permission "${permission}"`,
    };
  }

  // Ownership check for "own" permissions
  if (resource?.ownerId && isOwnOnlyPermission(permission)) {
    if (resource.ownerId !== auth.user.id) {
      // User has the "own" variant but doesn't own the resource.
      // Check if they also have the "others" variant.
      const othersPermission = ownToOthersPermission(permission);
      if (othersPermission && !auth.permissions.has(othersPermission)) {
        return {
          granted: false,
          reason: `User does not own this resource and lacks "${othersPermission}"`,
        };
      }
    }
  }

  return { granted: true };
}

/**
 * Assert a permission — throws AuthorizationError on failure.
 * Use in service methods and tRPC procedures.
 */
export function assertCan(
  auth: AuthContext,
  permission: PermissionSlug,
  resource?: ResourceContext,
): void {
  const result = can(auth, permission, resource);
  if (!result.granted) {
    throw new AuthorizationError(result.reason, {
      permission,
      role: auth.role,
      siteId: auth.siteId,
    });
  }
}

/**
 * Assert the user is authenticated (AuthContext exists).
 * Use at the top of any protected operation.
 */
export function assertAuthenticated(
  auth: AuthContext | null | undefined,
): asserts auth is AuthContext {
  if (!auth) {
    throw new AuthenticationError();
  }
}

// ────────────────────────────────────────────────────────────
// Named permission shortcuts
// ────────────────────────────────────────────────────────────
// These encode the business rules for common operations.
// They compose `can()` — never bypass it.
// ────────────────────────────────────────────────────────────

/** Can the user create new content entries? */
export function canCreateContent(auth: AuthContext): PermissionResult {
  return can(auth, "create_content");
}

/**
 * Can the user edit a specific content entry?
 * Authors can edit own content; editors can edit anyone's.
 */
export function canEditContent(
  auth: AuthContext,
  ownerId: string,
): PermissionResult {
  // First check if user can edit others' content (broader permission)
  const othersResult = can(auth, "edit_others_content");
  if (othersResult.granted) return othersResult;

  // Fall back to own content check
  return can(auth, "edit_own_content", { ownerId });
}

/**
 * Can the user delete a specific content entry?
 */
export function canDeleteContent(
  auth: AuthContext,
  ownerId: string,
): PermissionResult {
  const othersResult = can(auth, "delete_others_content");
  if (othersResult.granted) return othersResult;

  return can(auth, "delete_own_content", { ownerId });
}

/** Can the user transition content to PUBLISHED status? */
export function canPublishContent(auth: AuthContext): PermissionResult {
  return can(auth, "publish_content");
}

/** Can the user upload files to the media library? */
export function canUploadMedia(auth: AuthContext): PermissionResult {
  return can(auth, "upload_media");
}

/** Can the user moderate (approve/spam/trash) comments? */
export function canModerateComments(auth: AuthContext): PermissionResult {
  return can(auth, "moderate_comments");
}

/** Can the user manage other user accounts? */
export function canManageUsers(auth: AuthContext): PermissionResult {
  return can(auth, "edit_users");
}

/** Can the user change site-wide settings? */
export function canManageSettings(auth: AuthContext): PermissionResult {
  return can(auth, "manage_settings");
}

/** Can the user activate/deactivate plugins? */
export function canManagePlugins(auth: AuthContext): PermissionResult {
  return can(auth, "manage_plugins");
}

/** Can the user switch or customize themes? */
export function canManageAppearance(auth: AuthContext): PermissionResult {
  const themeResult = can(auth, "switch_themes");
  if (themeResult.granted) return themeResult;
  return can(auth, "customize_theme");
}

/** Can the user access the admin panel at all? */
export function canAccessAdmin(auth: AuthContext): PermissionResult {
  // Any authenticated user with at least "read" can see the admin panel.
  // What they see inside is further restricted by individual permissions.
  return can(auth, "read");
}

// ────────────────────────────────────────────────────────────
// Ownership mapping helpers
// ────────────────────────────────────────────────────────────

const OWN_PERMISSIONS = new Set<PermissionSlug>([
  "edit_own_content",
  "delete_own_content",
]);

const OWN_TO_OTHERS: Partial<Record<PermissionSlug, PermissionSlug>> = {
  edit_own_content: "edit_others_content",
  delete_own_content: "delete_others_content",
};

function isOwnOnlyPermission(perm: PermissionSlug): boolean {
  return OWN_PERMISSIONS.has(perm);
}

function ownToOthersPermission(
  perm: PermissionSlug,
): PermissionSlug | undefined {
  return OWN_TO_OTHERS[perm];
}
