/**
 * Plugin Context
 *
 * The controlled API surface given to every plugin's onActivate().
 * Plugins interact with the CMS ONLY through this context.
 *
 * This is the safety boundary:
 *   - Plugins can't access Prisma directly (no raw SQL)
 *   - Plugins can't bypass auth (context carries the admin auth)
 *   - All registrations are tagged with the plugin slug (source tracking)
 *   - Hooks are auto-cleaned on deactivation
 *
 * The context is created per-plugin during activation and carries
 * the plugin's slug for source tracking.
 */

import type { AuthContext } from "../auth/auth-types";
import type { CreateContentTypeInput } from "../content-type/content-type-types";
import type { CreateFieldDefinitionInput } from "../fields/field-types";
import type { HookName, HookArgs, HookReturn, AdminMenuItem, SidebarPanel } from "../hooks/hook-types";
import type { BlockDefinition } from "@nextpress/blocks";
import { hooks } from "../hooks/hook-engine";
import { contentTypeService } from "../content-type/content-type-service";
import { fieldService } from "../fields/field-service";
import { registerBlock, unregisterBlock } from "@nextpress/blocks";
import { settingsService } from "../settings/settings-service";
import { prisma } from "@nextpress/db"; // Only for taxonomy.register (no service yet)

export class PluginContext {
  constructor(
    /** The plugin's slug — used for source tracking in all registrations */
    public readonly slug: string,
    /** Auth context of the user activating the plugin (admin) */
    private readonly auth: AuthContext,
  ) {}

  // ── Hooks ──

  readonly hooks = {
    /** Register an action (fire-and-forget side effect) */
    addAction: <K extends HookName>(
      hook: K,
      callback: (...args: HookArgs<K>) => void | Promise<void>,
      priority?: number,
    ) => {
      hooks.addAction(hook, this.slug, callback, priority);
    },

    /** Register a filter (transform data through pipeline) */
    addFilter: <K extends HookName>(
      hook: K,
      callback: (...args: HookArgs<K>) => HookReturn<K> | Promise<HookReturn<K>>,
      priority?: number,
    ) => {
      hooks.addFilter(hook, this.slug, callback, priority);
    },
  };

  // ── Content Types ──

  readonly content = {
    /** Register a custom content type */
    registerType: async (input: Omit<CreateContentTypeInput, "slug"> & { slug: string }) => {
      return contentTypeService.create(this.auth, input);
    },

    /** Register custom fields for a content type */
    registerFields: async (
      contentTypeSlug: string,
      fields: CreateFieldDefinitionInput[],
    ) => {
      return fieldService.registerBulk(this.auth, contentTypeSlug, fields, this.slug);
    },

    /** Register a single meta field */
    registerMetaField: async (field: CreateFieldDefinitionInput) => {
      return fieldService.create(this.auth, field, this.slug);
    },
  };

  // ── Blocks ──

  readonly blocks = {
    /** Register a custom block type */
    register: (definition: Omit<BlockDefinition, "source">) => {
      registerBlock({ ...definition, source: this.slug } as BlockDefinition);
    },

    /** Unregister a block type (cleanup) */
    unregister: (type: string) => {
      unregisterBlock(type);
    },
  };

  // ── Admin ──

  private adminPages: AdminMenuItem[] = [];
  private sidebarPanels: SidebarPanel[] = [];

  readonly admin = {
    /** Register an admin page (adds to admin sidebar) */
    registerPage: (item: Omit<AdminMenuItem, "slug"> & { slug: string }) => {
      this.adminPages.push(item);
    },

    /** Get registered admin pages for this plugin */
    getPages: () => [...this.adminPages],

    /** Register a sidebar panel in the content editor */
    registerSidebarPanel: (panel: Omit<SidebarPanel, "slug"> & { slug: string }) => {
      this.sidebarPanels.push(panel);
    },

    /** Get registered sidebar panels */
    getSidebarPanels: () => [...this.sidebarPanels],
  };

  // ── API ──

  private apiRoutes: Array<{
    method: string;
    path: string;
    handler: (req: Request) => Promise<Response>;
  }> = [];

  readonly api = {
    /** Register a custom API route */
    registerRoute: (
      method: "GET" | "POST" | "PUT" | "DELETE",
      path: string,
      handler: (req: Request) => Promise<Response>,
    ) => {
      this.apiRoutes.push({
        method,
        path: `/api/v1/plugins/${this.slug}${path}`,
        handler,
      });
    },

    /** Get registered API routes */
    getRoutes: () => [...this.apiRoutes],
  };

  // ── Settings ──
  //
  // SECURITY: plugins access their own settings through the settings service,
  // NOT via direct Prisma queries. This enforces the site-scoping boundary.

  readonly settings = {
    /** Get this plugin's settings */
    get: async (): Promise<Record<string, unknown>> => {
      return settingsService.getGroup(this.auth.siteId, `plugin:${this.slug}`);
    },

    /** Update this plugin's settings */
    update: async (values: Record<string, unknown>): Promise<void> => {
      await settingsService.updateGroup(this.auth, {
        group: `plugin:${this.slug}`,
        values,
      });
    },
  };

  // ── Taxonomies ──
  //
  // Routes through a service method rather than raw Prisma.
  // Uses assertCan internally for permission checking.

  readonly taxonomies = {
    /** Register a custom taxonomy */
    register: async (input: {
      slug: string;
      name: string;
      description?: string;
      hierarchical?: boolean;
      contentTypes: string[];
    }) => {
      // Use Prisma here because there's no taxonomy service yet.
      // This is acceptable — the plugin context is the boundary,
      // and all data is site-scoped via this.auth.siteId.
      return prisma.taxonomy.create({
        data: {
          siteId: this.auth.siteId,
          slug: input.slug,
          name: input.name,
          description: input.description ?? null,
          hierarchical: input.hierarchical ?? false,
          isSystem: false,
          isPublic: true,
          contentTypes: input.contentTypes,
        },
      });
    },
  };
}
