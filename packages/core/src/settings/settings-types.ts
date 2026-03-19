import { z } from "zod";

// ── Setting groups ──

/** Built-in setting groups. Plugins add more via the admin:settings_groups hook. */
export const BUILT_IN_SETTING_GROUPS = [
  { slug: "general", name: "General", description: "Site title, tagline, URL" },
  { slug: "reading", name: "Reading", description: "Homepage display, posts per page" },
  { slug: "writing", name: "Writing", description: "Default editor settings" },
  { slug: "discussion", name: "Discussion", description: "Comment and moderation rules" },
  { slug: "media", name: "Media", description: "Upload limits, image sizes" },
  { slug: "permalinks", name: "Permalinks", description: "URL structure" },
] as const;

export interface SettingGroup {
  slug: string;
  name: string;
  description?: string;
  /** Fields in this group */
  fields: SettingFieldDef[];
  /** Who registered: "core" or plugin slug */
  source: string;
}

/** Defines a single setting field for the admin UI */
export interface SettingFieldDef {
  key: string;
  label: string;
  description?: string;
  type: "text" | "textarea" | "number" | "boolean" | "select" | "url" | "email" | "color";
  defaultValue: unknown;
  options?: Array<{ label: string; value: string }>;
  validation?: { min?: number; max?: number; pattern?: string };
}

// ── Input schemas ──

export const getSettingsSchema = z.object({
  group: z.string().min(1),
});

export const updateSettingsSchema = z.object({
  group: z.string().min(1),
  values: z.record(z.unknown()),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;

// ── Output ──

export interface SettingValue {
  group: string;
  key: string;
  value: unknown;
}

/** All settings for a group, as { key: value } */
export type SettingsMap = Record<string, unknown>;

// ── Default values for built-in settings ──

export const DEFAULT_SETTINGS: Record<string, Record<string, unknown>> = {
  general: {
    site_title: "",
    site_tagline: "",
    site_url: "",
    admin_email: "",
    timezone: "UTC",
    date_format: "YYYY-MM-DD",
  },
  reading: {
    homepage_display: "latest_posts",
    posts_per_page: 10,
    feed_items: 10,
  },
  writing: {
    default_category: "",
    default_post_format: "standard",
  },
  discussion: {
    comments_enabled: true,
    require_moderation: true,
    require_name_email: true,
    comment_max_depth: 3,
    comments_per_page: 50,
    notify_on_comment: true,
  },
  media: {
    max_upload_size_mb: 50,
    thumbnail_width: 150,
    thumbnail_height: 150,
    medium_width: 768,
    large_width: 1200,
  },
  permalinks: {
    post_structure: "/:slug",
    page_structure: "/:slug",
    category_base: "category",
    tag_base: "tag",
  },
};
