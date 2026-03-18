// ============================================================================
// Auth Configuration Constants
// ============================================================================
// Centralized auth settings. Imported by apps/web/lib/auth/config.ts
// and the seed scripts.
// ============================================================================

/**
 * All permission definitions for seeding.
 * Each entry becomes a row in the `permissions` table.
 */
export const PERMISSION_DEFINITIONS = [
  // Content
  { slug: "create_content", name: "Create Content", group: "content" },
  { slug: "edit_own_content", name: "Edit Own Content", group: "content" },
  { slug: "edit_others_content", name: "Edit Others' Content", group: "content" },
  { slug: "delete_own_content", name: "Delete Own Content", group: "content" },
  { slug: "delete_others_content", name: "Delete Others' Content", group: "content" },
  { slug: "publish_content", name: "Publish Content", group: "content" },
  { slug: "manage_categories", name: "Manage Categories", group: "content" },
  { slug: "manage_tags", name: "Manage Tags", group: "content" },

  // Media
  { slug: "upload_media", name: "Upload Media", group: "media" },
  { slug: "delete_media", name: "Delete Media", group: "media" },

  // Comments
  { slug: "moderate_comments", name: "Moderate Comments", group: "comments" },

  // Users
  { slug: "list_users", name: "List Users", group: "users" },
  { slug: "create_users", name: "Create Users", group: "users" },
  { slug: "edit_users", name: "Edit Users", group: "users" },
  { slug: "delete_users", name: "Delete Users", group: "users" },
  { slug: "promote_users", name: "Promote Users", group: "users" },

  // Appearance
  { slug: "switch_themes", name: "Switch Themes", group: "appearance" },
  { slug: "customize_theme", name: "Customize Theme", group: "appearance" },
  { slug: "manage_menus", name: "Manage Menus", group: "appearance" },

  // Plugins
  { slug: "activate_plugins", name: "Activate Plugins", group: "plugins" },
  { slug: "manage_plugins", name: "Manage Plugins", group: "plugins" },

  // Settings
  { slug: "manage_settings", name: "Manage Settings", group: "settings" },
  { slug: "manage_content_types", name: "Manage Content Types", group: "settings" },
  { slug: "manage_fields", name: "Manage Fields", group: "settings" },
  { slug: "manage_taxonomies", name: "Manage Taxonomies", group: "settings" },

  // Site
  { slug: "manage_sites", name: "Manage Sites", group: "site" },

  // Baseline
  { slug: "read", name: "Read", group: "general" },
  { slug: "edit_profile", name: "Edit Profile", group: "general" },
] as const;

/** Password hashing rounds for bcrypt */
export const BCRYPT_ROUNDS = 12;

/** Session / JWT configuration */
export const SESSION_CONFIG = {
  /** JWT strategy — stateless, no session table queries on every request */
  strategy: "jwt" as const,
  /** Session max age in seconds (30 days) */
  maxAge: 30 * 24 * 60 * 60,
  /** How often the session token is refreshed (1 day) */
  updateAge: 24 * 60 * 60,
};

/** Routes that don't require authentication */
export const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/v1",       // REST API uses bearer tokens, not session
  "/api/webhooks",
  "/feed.xml",
  "/sitemap.xml",
] as const;

/** Routes that require authentication */
export const PROTECTED_ROUTE_PREFIXES = ["/admin"] as const;
