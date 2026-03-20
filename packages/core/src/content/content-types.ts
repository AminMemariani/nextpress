import { z } from "zod";
import {
  slugSchema,
  optionalSlugSchema,
  contentStatusSchema,
  blockDataSchema,
  paginationSchema,
  sortOrderSchema,
  dateRangeSchema,
} from "../validation/schemas";
import type { BlockData, ContentStatusInput } from "../validation/schemas";
export type { ContentStatusInput } from "../validation/schemas";

// ── Create ──

export const createContentEntrySchema = z.object({
  contentTypeSlug: z.string().min(1),
  title: z.string().min(1).max(500),
  slug: optionalSlugSchema,              // auto-generated from title if omitted
  excerpt: z.string().max(2000).optional().nullable(),
  blocks: z.array(blockDataSchema).default([]),
  status: contentStatusSchema.default("DRAFT"),
  password: z.string().max(100).optional().nullable(),
  parentId: z.string().cuid().optional().nullable(),
  template: z.string().max(100).optional().nullable(),
  menuOrder: z.number().int().default(0),
  scheduledAt: z.coerce.date().optional().nullable(),
  fields: z.record(z.unknown()).default({}),
  termIds: z.array(z.string().cuid()).default([]),
  featuredImageId: z.string().cuid().optional().nullable(),
});

export type CreateContentEntryInput = z.infer<typeof createContentEntrySchema>;

// ── Update ──

export const updateContentEntrySchema = z.object({
  title: z.string().min(1).max(500).optional(),
  slug: optionalSlugSchema,
  excerpt: z.string().max(2000).optional().nullable(),
  blocks: z.array(blockDataSchema).optional(),
  status: contentStatusSchema.optional(),
  password: z.string().max(100).optional().nullable(),
  parentId: z.string().cuid().optional().nullable(),
  template: z.string().max(100).optional().nullable(),
  menuOrder: z.number().int().optional(),
  scheduledAt: z.coerce.date().optional().nullable(),
  fields: z.record(z.unknown()).optional(),
  termIds: z.array(z.string().cuid()).optional(),
  featuredImageId: z.string().cuid().optional().nullable(),
});

export type UpdateContentEntryInput = z.infer<typeof updateContentEntrySchema>;

// ── List / Filter ──

export const listContentEntriesSchema = paginationSchema.extend({
  contentTypeSlug: z.string().min(1),
  status: contentStatusSchema.optional(),
  authorId: z.string().cuid().optional(),
  search: z.string().max(200).optional(),
  termIds: z.array(z.string().cuid()).optional(),
  sortBy: z
    .enum(["publishedAt", "createdAt", "updatedAt", "title", "menuOrder"])
    .default("createdAt"),
  sortOrder: sortOrderSchema,
  dateRange: dateRangeSchema.optional(),
});

export type ListContentEntriesInput = z.infer<typeof listContentEntriesSchema>;

// ── Status transitions ──

export const statusTransitionSchema = z.object({
  status: contentStatusSchema,
  scheduledAt: z.coerce.date().optional().nullable(),
});

export type StatusTransitionInput = z.infer<typeof statusTransitionSchema>;

/** Valid status transitions. Key = current status, value = allowed next statuses. */
export const STATUS_TRANSITIONS: Record<ContentStatusInput, ContentStatusInput[]> = {
  DRAFT: ["PENDING_REVIEW", "PUBLISHED", "SCHEDULED", "PRIVATE", "TRASH"],
  PENDING_REVIEW: ["DRAFT", "PUBLISHED", "SCHEDULED", "PRIVATE", "TRASH"],
  PUBLISHED: ["DRAFT", "PRIVATE", "ARCHIVED", "TRASH"],
  SCHEDULED: ["DRAFT", "PUBLISHED", "TRASH"],
  PRIVATE: ["DRAFT", "PUBLISHED", "TRASH"],
  ARCHIVED: ["DRAFT", "PUBLISHED", "TRASH"],
  TRASH: ["DRAFT"],
};

// ── Output DTO ──

export interface ContentEntryDto {
  id: string;
  siteId: string;
  contentType: {
    id: string;
    slug: string;
    nameSingular: string;
  };
  status: ContentStatusInput;
  title: string;
  slug: string;
  excerpt: string | null;
  blocks: BlockData[];
  password: string | null;
  author: {
    id: string;
    name: string | null;
    displayName: string | null;
    image: string | null;
  };
  parentId: string | null;
  menuOrder: number;
  template: string | null;
  publishedAt: Date | null;
  scheduledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  fields: Record<string, unknown>;
  terms: Array<{
    id: string;
    name: string;
    slug: string;
    taxonomy: { slug: string; name: string };
  }>;
  featuredImage: {
    id: string;
    url: string;
    alt: string | null;
    width: number | null;
    height: number | null;
  } | null;
  revisionCount: number;
}

/** Slim DTO for list views (no blocks, no full relations) */
export interface ContentEntryListDto {
  id: string;
  contentTypeSlug: string;
  status: ContentStatusInput;
  title: string;
  slug: string;
  excerpt: string | null;
  author: {
    id: string;
    name: string | null;
    displayName: string | null;
  };
  publishedAt: Date | null;
  scheduledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  commentCount: number;
}
