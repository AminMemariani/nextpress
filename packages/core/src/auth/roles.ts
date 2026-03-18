// ============================================================================
// Role Definitions
// ============================================================================
// Defines which permissions each built-in role carries.
// This is the SEED DATA source — the DB is authoritative at runtime.
//
// Why define here and not only in the seed?
//   - The seed imports this, keeping it DRY.
//   - Permission checks can fall back to these defaults if the DB is
//     unreachable (defense in depth, not primary path).
//   - TypeScript enforces that every role maps to valid PermissionSlugs.
// ============================================================================

import type { PermissionSlug, RoleSlug } from "./auth-types";

export interface RoleDefinition {
  slug: RoleSlug;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: readonly PermissionSlug[];
}

/**
 * Permission set for each built-in role.
 * Ordered from most to least privileged.
 *
 * super_admin is NOT in this map — it bypasses all checks.
 */
export const ROLE_DEFINITIONS: readonly RoleDefinition[] = [
  {
    slug: "admin",
    name: "Administrator",
    description: "Full access to a single site",
    isSystem: true,
    permissions: [
      // Content
      "create_content",
      "edit_own_content",
      "edit_others_content",
      "delete_own_content",
      "delete_others_content",
      "publish_content",
      "manage_categories",
      "manage_tags",
      // Media
      "upload_media",
      "delete_media",
      // Comments
      "moderate_comments",
      // Users
      "list_users",
      "create_users",
      "edit_users",
      "delete_users",
      "promote_users",
      // Appearance
      "switch_themes",
      "customize_theme",
      "manage_menus",
      // Plugins
      "activate_plugins",
      "manage_plugins",
      // Settings
      "manage_settings",
      "manage_content_types",
      "manage_fields",
      "manage_taxonomies",
      // Baseline
      "read",
      "edit_profile",
    ],
  },
  {
    slug: "editor",
    name: "Editor",
    description: "Can manage all content and moderate comments",
    isSystem: true,
    permissions: [
      "create_content",
      "edit_own_content",
      "edit_others_content",
      "delete_own_content",
      "delete_others_content",
      "publish_content",
      "manage_categories",
      "manage_tags",
      "upload_media",
      "delete_media",
      "moderate_comments",
      "list_users",
      "manage_menus",
      "read",
      "edit_profile",
    ],
  },
  {
    slug: "author",
    name: "Author",
    description: "Can create and publish own content",
    isSystem: true,
    permissions: [
      "create_content",
      "edit_own_content",
      "delete_own_content",
      "publish_content",
      "upload_media",
      "read",
      "edit_profile",
    ],
  },
  {
    slug: "contributor",
    name: "Contributor",
    description: "Can create content but cannot publish",
    isSystem: true,
    permissions: [
      "create_content",
      "edit_own_content",
      "delete_own_content",
      "read",
      "edit_profile",
    ],
  },
  {
    slug: "subscriber",
    name: "Subscriber",
    description: "Can read content and manage own profile",
    isSystem: true,
    permissions: ["read", "edit_profile"],
  },
] as const;

/** Quick lookup: role slug → definition */
export const ROLE_MAP = new Map(
  ROLE_DEFINITIONS.map((r) => [r.slug, r]),
);

/** super_admin definition (kept separate — it bypasses checks, not matched) */
export const SUPER_ADMIN_ROLE: RoleDefinition = {
  slug: "super_admin",
  name: "Super Administrator",
  description: "Full access across all sites",
  isSystem: true,
  permissions: [], // irrelevant — super_admin bypasses all checks
};
