/**
 * Theme System — Types & Interfaces
 *
 * A theme is a directory on disk with a theme.json manifest.
 * The DB (ThemeInstall) tracks which themes are installed and which
 * is active per site. Theme code is loaded at startup and cached.
 *
 * Design constraints:
 *   - Themes are STATIC. No runtime code generation, no eval.
 *   - Templates are React components (server-safe RSC).
 *   - Block overrides use the existing overrideRenderComponent() API.
 *   - Customizations are JSON validated against the theme's settings schema.
 *   - Template resolution is deterministic and cacheable.
 */

import { z } from "zod";
import type { ComponentType } from "react";
import type { BlockData } from "../validation/schemas";

// ── Theme Manifest (theme.json) ──

export const themeManifestSchema = z.object({
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  version: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  authorUrl: z.string().url().optional(),
  screenshot: z.string().optional(),
  supports: z.object({
    menuLocations: z.array(z.string()).default(["primary", "footer"]),
    widgetAreas: z.array(z.string()).default([]),
    customColors: z.boolean().default(true),
    darkMode: z.boolean().default(false),
  }).default({}),
  /** JSON Schema for theme-specific settings (colors, fonts, layout) */
  settings: z.record(z.unknown()).default({}),
  /** Templates this theme provides (auto-discovered from templates/ dir) */
  templates: z.array(z.string()).default([]),
  /** Per-content-entry template choices shown in the editor sidebar */
  templateChoices: z.array(z.object({
    slug: z.string(),
    name: z.string(),
    description: z.string().optional(),
    contentTypes: z.array(z.string()).default([]),
  })).default([]),
});

export type ThemeManifest = z.infer<typeof themeManifestSchema>;

// ── Template Types ──

/** The context passed to every template component */
export interface TemplateContext {
  /** The content entry being rendered (null for archives, search, 404) */
  entry: TemplateEntry | null;
  /** For archive pages: the list of entries */
  entries?: TemplateEntry[];
  /** Pagination info for archives */
  pagination?: { page: number; totalPages: number; total: number };
  /** For taxonomy archives: the current term */
  term?: { name: string; slug: string; taxonomy: string };
  /** For search: the query string */
  searchQuery?: string;
  /** Site-level data */
  site: { name: string; tagline: string | null; url: string };
  /** Active theme customizations (colors, fonts, etc.) */
  customizations: Record<string, unknown>;
}

/** Slim content entry for template rendering */
export interface TemplateEntry {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  blocks: BlockData[];
  status: string;
  contentType: { slug: string; nameSingular: string };
  author: { name: string | null; displayName: string | null; image: string | null };
  publishedAt: Date | null;
  createdAt: Date;
  template: string | null;
  fields: Record<string, unknown>;
  terms: Array<{ name: string; slug: string; taxonomy: { slug: string } }>;
  featuredImage: { url: string; alt: string | null; width: number | null; height: number | null } | null;
}

/** Props for template components */
export interface TemplateProps {
  context: TemplateContext;
}

/** A resolved template — the component to render for a given request */
export type TemplateComponent = ComponentType<TemplateProps>;

// ── Template Slug Conventions ──

/**
 * Template names follow WordPress conventions:
 *
 *   single              → any single entry
 *   single-{type}       → single entry of a specific content type
 *   single-{type}-{slug}→ exact entry match
 *   page                → hierarchical content (pages)
 *   archive             → any listing
 *   archive-{type}      → listing for a specific content type
 *   taxonomy            → any taxonomy archive
 *   taxonomy-{tax}      → specific taxonomy
 *   taxonomy-{tax}-{term}→ specific term
 *   home                → homepage (blog index)
 *   front-page          → static front page
 *   search              → search results
 *   404                 → not found
 *   index               → ultimate fallback
 */
export type BuiltInTemplate =
  | "single"
  | "page"
  | "archive"
  | "home"
  | "front-page"
  | "search"
  | "404"
  | "index"
  | "taxonomy";

// ── Theme Runtime ──

/** A loaded theme ready for use */
export interface LoadedTheme {
  manifest: ThemeManifest;
  /** Template components keyed by template slug */
  templates: Map<string, TemplateComponent>;
  /** Layout wrapper component */
  layout: ComponentType<{ children: React.ReactNode; customizations: Record<string, unknown> }>;
  /** Block render overrides: block type → component */
  blockOverrides: Map<string, ComponentType<any>>;
  /** CSS file path (relative to theme dir) */
  cssPath: string | null;
}

/** Theme discovery result from scanning the themes/ directory */
export interface DiscoveredTheme {
  slug: string;
  manifest: ThemeManifest;
  dirPath: string;
}
