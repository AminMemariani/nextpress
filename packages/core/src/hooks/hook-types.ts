/**
 * Hook System — Type Definitions
 *
 * Two kinds of hooks:
 *   - ACTIONS: fire-and-forget side effects. All handlers run, return values ignored.
 *   - FILTERS: transform data through a pipeline. Each handler receives the output
 *     of the previous handler. The final result is returned to the caller.
 *
 * Every hook is typed via the HookRegistry interface. Adding a new hook requires
 * adding an entry here. Plugins extend it via module augmentation:
 *
 *   declare module "@nextpress/core" {
 *     interface HookRegistry {
 *       'seo:meta_tags': { args: [tags: MetaTags, entry: ContentEntry]; returns: MetaTags };
 *     }
 *   }
 *
 * Source tracking: every registration includes the plugin slug that registered it.
 * This enables clean deactivation — removeBySource("seo-toolkit") removes all
 * hooks that plugin registered, without touching core or other plugin hooks.
 */

import type { ContentEntryDto } from "../content/content-types";
import type { BlockData } from "../validation/schemas";

/** Registry of all known hook names → their argument and return types */
export interface HookRegistry {
  // ── Content lifecycle (actions) ──
  "content:before_save": { args: [entry: ContentSavePayload]; returns: void };
  "content:after_save": { args: [entry: ContentEntryDto]; returns: void };
  "content:before_delete": { args: [entryId: string, siteId: string]; returns: void };
  "content:after_delete": { args: [entryId: string, siteId: string]; returns: void };
  "content:status_change": {
    args: [entry: ContentEntryDto, oldStatus: string, newStatus: string];
    returns: void;
  };
  "content:published": { args: [entry: ContentEntryDto]; returns: void };

  // ── Content rendering (filters) ──
  "render:blocks": { args: [blocks: BlockData[], entry: ContentEntryDto]; returns: BlockData[] };
  "render:meta_tags": { args: [tags: Record<string, string>, entry: ContentEntryDto]; returns: Record<string, string> };
  "render:excerpt": { args: [excerpt: string, entry: ContentEntryDto]; returns: string };

  // ── Admin (filters) ──
  "admin:menu_items": { args: [items: AdminMenuItem[]]; returns: AdminMenuItem[] };
  "admin:editor_sidebar_panels": { args: [panels: SidebarPanel[]]; returns: SidebarPanel[] };

  // ── User lifecycle (actions) ──
  "user:registered": { args: [userId: string, email: string]; returns: void };
  "user:login": { args: [userId: string]; returns: void };

  // ── Comment lifecycle (actions) ──
  "comment:submitted": { args: [commentId: string, contentEntryId: string]; returns: void };
  "comment:approved": { args: [commentId: string]; returns: void };

  // ── Media (actions) ──
  "media:uploaded": { args: [mediaId: string, siteId: string]; returns: void };

  // ── API (filters) ──
  "api:response": { args: [data: unknown, endpoint: string]; returns: unknown };
}

/** Hook names */
export type HookName = keyof HookRegistry;

/** Extract args type for a hook */
export type HookArgs<K extends HookName> = HookRegistry[K]["args"];

/** Extract return type for a hook (void for actions, first arg type for filters) */
export type HookReturn<K extends HookName> = HookRegistry[K]["returns"];

/** A registered hook handler */
export interface HookHandler<K extends HookName = HookName> {
  callback: (...args: HookArgs<K>) => HookReturn<K> | Promise<HookReturn<K>>;
  priority: number;
  source: string;
}

// ── Supporting types used in hooks ──

export interface ContentSavePayload {
  id?: string;
  title: string;
  slug: string;
  blocks: BlockData[];
  status: string;
  contentTypeSlug: string;
  siteId: string;
  authorId: string;
}

export interface AdminMenuItem {
  slug: string;
  label: string;
  href: string;
  icon?: string;
  parentSlug?: string;
  position?: number;
  capability?: string;
}

export interface SidebarPanel {
  slug: string;
  title: string;
  icon?: string;
  component: () => Promise<{ default: React.ComponentType<any> }>;
  contentTypes?: string[];
  position?: number;
}
