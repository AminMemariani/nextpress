import { z } from "zod";

// ── Menu item types ──

export const menuItemTypeSchema = z.enum(["custom", "content", "taxonomy"]);
export type MenuItemType = z.infer<typeof menuItemTypeSchema>;

// ── Input schemas ──

export const menuItemInputSchema = z.object({
  id: z.string().optional(),       // existing item ID (for updates)
  label: z.string().min(1).max(200),
  url: z.string().max(2000).optional().nullable(),
  type: menuItemTypeSchema,
  objectId: z.string().cuid().optional().nullable(),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  cssClass: z.string().max(200).optional().nullable(),
  openInNewTab: z.boolean().default(false),
});

export type MenuItemInput = z.infer<typeof menuItemInputSchema>;

export const saveMenuSchema = z.object({
  location: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  items: z.array(menuItemInputSchema),
});

export type SaveMenuInput = z.infer<typeof saveMenuSchema>;

// ── Output DTOs ──

export interface MenuDto {
  id: string;
  siteId: string;
  name: string;
  location: string;
  items: MenuItemDto[];
}

export interface MenuItemDto {
  id: string;
  label: string;
  url: string | null;
  type: MenuItemType;
  objectId: string | null;
  parentId: string | null;
  sortOrder: number;
  cssClass: string | null;
  openInNewTab: boolean;
  /** Resolved URL (for content/taxonomy items) */
  resolvedUrl: string | null;
  /** Nested children (built from flat list) */
  children: MenuItemDto[];
}

/** Theme-declared menu location */
export interface MenuLocation {
  slug: string;
  name: string;
  description?: string;
}
