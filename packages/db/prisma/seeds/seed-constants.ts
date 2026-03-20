/**
 * Seed-only constants.
 *
 * Duplicated from @nextpress/core to avoid a circular workspace dependency
 * (core depends on db at runtime, so db cannot depend on core).
 *
 * If you change role definitions or permissions in core, update these too.
 */

// ── Bcrypt ──

export const BCRYPT_ROUNDS = 12;

// ── Permission slugs ──

export type PermissionSlug =
  | "create_content" | "edit_own_content" | "edit_others_content"
  | "delete_own_content" | "delete_others_content" | "publish_content"
  | "manage_categories" | "manage_tags"
  | "upload_media" | "delete_media"
  | "moderate_comments"
  | "list_users" | "create_users" | "edit_users" | "delete_users" | "promote_users"
  | "switch_themes" | "customize_theme" | "manage_menus"
  | "activate_plugins" | "manage_plugins"
  | "manage_settings" | "manage_content_types" | "manage_fields" | "manage_taxonomies"
  | "manage_sites"
  | "read" | "edit_profile";

export type RoleSlug =
  | "super_admin" | "admin" | "editor" | "author" | "contributor" | "subscriber";

// ── Permission definitions (for seeding the permissions table) ──

export const PERMISSION_DEFINITIONS = [
  { slug: "create_content", name: "Create Content", group: "content" },
  { slug: "edit_own_content", name: "Edit Own Content", group: "content" },
  { slug: "edit_others_content", name: "Edit Others' Content", group: "content" },
  { slug: "delete_own_content", name: "Delete Own Content", group: "content" },
  { slug: "delete_others_content", name: "Delete Others' Content", group: "content" },
  { slug: "publish_content", name: "Publish Content", group: "content" },
  { slug: "manage_categories", name: "Manage Categories", group: "content" },
  { slug: "manage_tags", name: "Manage Tags", group: "content" },
  { slug: "upload_media", name: "Upload Media", group: "media" },
  { slug: "delete_media", name: "Delete Media", group: "media" },
  { slug: "moderate_comments", name: "Moderate Comments", group: "comments" },
  { slug: "list_users", name: "List Users", group: "users" },
  { slug: "create_users", name: "Create Users", group: "users" },
  { slug: "edit_users", name: "Edit Users", group: "users" },
  { slug: "delete_users", name: "Delete Users", group: "users" },
  { slug: "promote_users", name: "Promote Users", group: "users" },
  { slug: "switch_themes", name: "Switch Themes", group: "appearance" },
  { slug: "customize_theme", name: "Customize Theme", group: "appearance" },
  { slug: "manage_menus", name: "Manage Menus", group: "appearance" },
  { slug: "activate_plugins", name: "Activate Plugins", group: "plugins" },
  { slug: "manage_plugins", name: "Manage Plugins", group: "plugins" },
  { slug: "manage_settings", name: "Manage Settings", group: "settings" },
  { slug: "manage_content_types", name: "Manage Content Types", group: "settings" },
  { slug: "manage_fields", name: "Manage Fields", group: "settings" },
  { slug: "manage_taxonomies", name: "Manage Taxonomies", group: "settings" },
  { slug: "manage_sites", name: "Manage Sites", group: "site" },
  { slug: "read", name: "Read", group: "general" },
  { slug: "edit_profile", name: "Edit Profile", group: "general" },
] as const;

// ── Role definitions (for seeding the roles table) ──

export interface RoleDefinition {
  slug: RoleSlug;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: readonly PermissionSlug[];
}

export const SUPER_ADMIN_ROLE: RoleDefinition = {
  slug: "super_admin",
  name: "Super Administrator",
  description: "Full access across all sites",
  isSystem: true,
  permissions: [],
};

export const ROLE_DEFINITIONS: readonly RoleDefinition[] = [
  {
    slug: "admin",
    name: "Administrator",
    description: "Full access to a single site",
    isSystem: true,
    permissions: [
      "create_content", "edit_own_content", "edit_others_content",
      "delete_own_content", "delete_others_content", "publish_content",
      "manage_categories", "manage_tags",
      "upload_media", "delete_media",
      "moderate_comments",
      "list_users", "create_users", "edit_users", "delete_users", "promote_users",
      "switch_themes", "customize_theme", "manage_menus",
      "activate_plugins", "manage_plugins",
      "manage_settings", "manage_content_types", "manage_fields", "manage_taxonomies",
      "read", "edit_profile",
    ],
  },
  {
    slug: "editor",
    name: "Editor",
    description: "Can manage all content and moderate comments",
    isSystem: true,
    permissions: [
      "create_content", "edit_own_content", "edit_others_content",
      "delete_own_content", "delete_others_content", "publish_content",
      "manage_categories", "manage_tags",
      "upload_media", "delete_media",
      "moderate_comments", "list_users", "manage_menus",
      "read", "edit_profile",
    ],
  },
  {
    slug: "author",
    name: "Author",
    description: "Can create and publish own content",
    isSystem: true,
    permissions: [
      "create_content", "edit_own_content", "delete_own_content",
      "publish_content", "upload_media",
      "read", "edit_profile",
    ],
  },
  {
    slug: "contributor",
    name: "Contributor",
    description: "Can create content but cannot publish",
    isSystem: true,
    permissions: [
      "create_content", "edit_own_content", "delete_own_content",
      "read", "edit_profile",
    ],
  },
  {
    slug: "subscriber",
    name: "Subscriber",
    description: "Can read content and manage own profile",
    isSystem: true,
    permissions: ["read", "edit_profile"],
  },
];
