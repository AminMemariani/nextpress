/**
 * Plugin System — Type Definitions
 *
 * A plugin is a directory under plugins/ with:
 *   - plugin.json: manifest (name, version, permissions, settings schema)
 *   - index.ts: entry point exporting a PluginDefinition
 *
 * Plugins run in the SAME PROCESS as the CMS. No sandboxing.
 * This is the same trust model as WordPress and npm packages.
 * The safety boundary is the PluginContext — plugins access CMS
 * capabilities through a controlled API, not by importing internals.
 */

import { z } from "zod";
import type { PluginContext } from "./plugin-context";

// ── Plugin Manifest (plugin.json) ──

export const pluginManifestSchema = z.object({
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  version: z.string(),
  description: z.string().optional(),
  author: z.string().optional(),
  authorUrl: z.string().url().optional(),
  /** Minimum CMS version required */
  requires: z.string().optional(),
  /** Plugin slugs this plugin depends on */
  dependencies: z.array(z.string()).default([]),
  /** New permission slugs this plugin introduces */
  permissions: z.array(z.object({
    slug: z.string(),
    name: z.string(),
    description: z.string().optional(),
    group: z.string().default("plugin"),
  })).default([]),
  /** JSON Schema for plugin-specific settings */
  settings: z.record(z.unknown()).default({}),
  /** Content types this plugin registers (declared, not created here) */
  contentTypes: z.array(z.string()).default([]),
  /** Taxonomies this plugin registers */
  taxonomies: z.array(z.string()).default([]),
});

export type PluginManifest = z.infer<typeof pluginManifestSchema>;

// ── Plugin Definition (default export from index.ts) ──

export interface PluginDefinition {
  /** Must match plugin.json slug */
  slug: string;

  /**
   * Called when the plugin is activated.
   * Register hooks, content types, fields, blocks, admin pages, API routes.
   * This runs once per server startup for active plugins.
   */
  onActivate: (ctx: PluginContext) => void | Promise<void>;

  /**
   * Called when the plugin is deactivated.
   * Optional — hooks registered via ctx are auto-removed by source tracking.
   * Use this for additional cleanup only.
   */
  onDeactivate?: (ctx: PluginContext) => void | Promise<void>;

  /**
   * Called when the plugin is uninstalled (permanently removed).
   * Clean up DB data: custom meta fields, settings, etc.
   */
  onUninstall?: (ctx: PluginContext) => void | Promise<void>;
}

// ── Plugin Discovery ──

export interface DiscoveredPlugin {
  slug: string;
  manifest: PluginManifest;
  dirPath: string;
}

// ── Plugin State (from DB) ──

export interface PluginState {
  slug: string;
  version: string;
  isActive: boolean;
  settings: Record<string, unknown>;
  activatedAt: Date | null;
}

// ── Plugin Lifecycle Events ──

export type PluginLifecycleEvent =
  | "discovered"
  | "activating"
  | "activated"
  | "deactivating"
  | "deactivated"
  | "uninstalling"
  | "uninstalled"
  | "error";
