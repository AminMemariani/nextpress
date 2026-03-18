/**
 * Block System — Core Types
 *
 * Contract between: DB storage, editor, renderer, plugins, and themes.
 *
 * Design:
 *   1. Blocks are DATA, not classes. Each type has a BlockDefinition that
 *      declares its attribute schema (Zod), version, and migration path.
 *   2. Attribute schema is Zod — validates on save, load, and render.
 *   3. Versioning: version number + migrate() function per definition.
 *      Runs transparently when stale data is encountered.
 *   4. Edit (client-only, heavyweight) and Render (server-safe, lightweight)
 *      components are registered separately.
 */

import { z } from "zod";
import type { ComponentType } from "react";
import type { BlockData } from "@nextpress/core/validation/schemas";

// Re-export for convenience
export type { BlockData } from "@nextpress/core/validation/schemas";

// ── Attribute type extraction ──

export type InferAttributes<T extends z.ZodTypeAny> = z.infer<T>;

// ── Categories ──

export type BlockCategory =
  | "text"
  | "media"
  | "layout"
  | "embed"
  | "widgets"
  | "theme"
  | "plugin";

export const BLOCK_CATEGORIES: { slug: BlockCategory; title: string }[] = [
  { slug: "text", title: "Text" },
  { slug: "media", title: "Media" },
  { slug: "layout", title: "Layout" },
  { slug: "embed", title: "Embed" },
  { slug: "widgets", title: "Widgets" },
  { slug: "theme", title: "Theme" },
  { slug: "plugin", title: "Plugin" },
];

// ── Block Definition ──

export interface BlockDefinition<
  TSchema extends z.ZodObject<z.ZodRawShape> = z.ZodObject<z.ZodRawShape>,
> {
  /** Namespaced type: "core/paragraph", "plugin/testimonial" */
  type: string;
  title: string;
  description?: string;
  icon: string;
  category: BlockCategory;
  keywords?: string[];

  /** Zod schema for attributes — single source of truth for validation */
  attributesSchema: TSchema;
  /** Default values for a freshly inserted block */
  defaultAttributes: z.infer<TSchema>;

  /** Schema version. Increment on breaking attribute changes. */
  version: number;
  /**
   * Migrate old attributes → current version. Pure function.
   * Called once per version step: v1→v2, then v2→v3, etc.
   */
  migrate?: (
    oldAttributes: Record<string, unknown>,
    fromVersion: number,
  ) => Record<string, unknown>;

  /** Can this block contain inner blocks? (e.g., columns) */
  allowsInnerBlocks: boolean;
  /** Restrict allowed inner block types (empty = all) */
  allowedInnerBlockTypes?: string[];

  /** Who registered: "core", theme slug, or plugin slug */
  source: string;

  /** Server-safe render component. Null = editor-only block. */
  renderComponent: ComponentType<BlockRenderProps<z.infer<TSchema>>> | null;
}

// ── Component Props ──

/** Props for server-side render (public site) */
export interface BlockRenderProps<TAttributes = Record<string, unknown>> {
  attributes: TAttributes;
  children?: React.ReactNode;
  className?: string;
  blockData: BlockData;
}

/** Props for client-side edit (admin editor) */
export interface BlockEditProps<TAttributes = Record<string, unknown>> {
  attributes: TAttributes;
  setAttributes: (partial: Partial<TAttributes>) => void;
  isSelected: boolean;
  children?: React.ReactNode;
  insertBlockAfter: (block: BlockData) => void;
  removeSelf: () => void;
  clientId: string;
}

// ── Block Data Factory ──

export function createBlockData(
  type: string,
  attributes: Record<string, unknown> = {},
  innerBlocks: BlockData[] = [],
): BlockData {
  return { id: generateBlockId(), type, attributes, innerBlocks };
}

export function generateBlockId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `blk_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
