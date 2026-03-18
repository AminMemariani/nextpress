// ============================================================================
// Auth & Authorization Types
// ============================================================================
// These types flow through the entire system: session callbacks, middleware,
// server components, tRPC context, and permission checks.
//
// Design:
//   - PermissionMap uses interface merging so plugins can add permissions
//     at compile-time via module augmentation.
//   - SessionUser is intentionally slim — it lives in the JWT.
//   - AuthContext is resolved per-request by combining session + site role.
//     It is NOT cached in the JWT because a user's role can differ per site.
// ============================================================================

/**
 * All permission slugs. Plugins extend via module augmentation:
 *
 *   declare module "@nextpress/core" {
 *     interface PermissionMap { manage_seo: true }
 *   }
 */
export interface PermissionMap {
  // ── Content ──
  create_content: true;
  edit_own_content: true;
  edit_others_content: true;
  delete_own_content: true;
  delete_others_content: true;
  publish_content: true;
  manage_categories: true;
  manage_tags: true;

  // ── Media ──
  upload_media: true;
  delete_media: true;

  // ── Comments ──
  moderate_comments: true;

  // ── Users ──
  list_users: true;
  create_users: true;
  edit_users: true;
  delete_users: true;
  promote_users: true;

  // ── Appearance ──
  switch_themes: true;
  customize_theme: true;
  manage_menus: true;

  // ── Plugins ──
  activate_plugins: true;
  manage_plugins: true;

  // ── Settings ──
  manage_settings: true;
  manage_content_types: true;
  manage_fields: true;
  manage_taxonomies: true;

  // ── Site ──
  manage_sites: true;

  // ── Baseline ──
  read: true;
  edit_profile: true;
}

/** Type-safe permission slug */
export type PermissionSlug = keyof PermissionMap;

/** Built-in role slugs */
export type RoleSlug =
  | "super_admin"
  | "admin"
  | "editor"
  | "author"
  | "contributor"
  | "subscriber";

/**
 * Slim user object embedded in the JWT. Fetched once on login,
 * carried in every request via the session token.
 */
export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  displayName: string | null;
  image: string | null;
}

/**
 * Authorization context resolved per-request.
 * Combines session user + site-scoped role + resolved permissions.
 */
export interface AuthContext {
  user: SessionUser;
  siteId: string;
  role: RoleSlug;
  permissions: Set<PermissionSlug>;
}

/** Ownership context for resource-level checks */
export interface ResourceContext {
  ownerId?: string;
  contentEntryId?: string;
  siteId?: string;
}

/** Result of a permission check */
export type PermissionResult =
  | { granted: true }
  | { granted: false; reason: string };
