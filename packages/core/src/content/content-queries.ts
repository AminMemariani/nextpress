/**
 * Content Query Builders
 *
 * Translates ListContentEntriesInput into Prisma where/orderBy clauses.
 * Separated from the service so queries can be composed and tested independently.
 */

import type { Prisma } from "@prisma/client";
import type { ListContentEntriesInput } from "./content-types";

/** Build the Prisma `where` clause for content listing */
export function buildContentWhere(
  siteId: string,
  contentTypeId: string,
  input: ListContentEntriesInput,
): Prisma.ContentEntryWhereInput {
  const where: Prisma.ContentEntryWhereInput = {
    siteId,
    contentTypeId,
  };

  if (input.status) {
    where.status = input.status;
  }

  if (input.authorId) {
    where.authorId = input.authorId;
  }

  if (input.search) {
    where.OR = [
      { title: { contains: input.search, mode: "insensitive" } },
      { excerpt: { contains: input.search, mode: "insensitive" } },
    ];
  }

  if (input.termIds?.length) {
    where.terms = {
      some: { termId: { in: input.termIds } },
    };
  }

  if (input.dateRange) {
    const dateFilter: Prisma.DateTimeNullableFilter = {};
    if (input.dateRange.from) dateFilter.gte = input.dateRange.from;
    if (input.dateRange.to) dateFilter.lte = input.dateRange.to;
    if (Object.keys(dateFilter).length > 0) {
      where.createdAt = dateFilter as Prisma.DateTimeFilter;
    }
  }

  return where;
}

/** Build the Prisma `orderBy` clause */
export function buildContentOrderBy(
  input: ListContentEntriesInput,
): Prisma.ContentEntryOrderByWithRelationInput {
  const direction = input.sortOrder;

  switch (input.sortBy) {
    case "publishedAt":
      return { publishedAt: direction };
    case "updatedAt":
      return { updatedAt: direction };
    case "title":
      return { title: direction };
    case "menuOrder":
      return { menuOrder: direction };
    case "createdAt":
    default:
      return { createdAt: direction };
  }
}

/** Standard select for list views (slim DTO without blocks) */
export const CONTENT_LIST_SELECT = {
  id: true,
  status: true,
  title: true,
  slug: true,
  excerpt: true,
  publishedAt: true,
  scheduledAt: true,
  createdAt: true,
  updatedAt: true,
  contentType: { select: { slug: true } },
  author: {
    select: { id: true, name: true, displayName: true },
  },
  _count: { select: { comments: true } },
} as const;

/** Full select for single entry views */
export const CONTENT_FULL_SELECT = {
  id: true,
  siteId: true,
  status: true,
  title: true,
  slug: true,
  excerpt: true,
  blocks: true,
  password: true,
  menuOrder: true,
  template: true,
  parentId: true,
  publishedAt: true,
  scheduledAt: true,
  createdAt: true,
  updatedAt: true,
  contentType: {
    select: { id: true, slug: true, nameSingular: true },
  },
  author: {
    select: { id: true, name: true, displayName: true, image: true },
  },
  fieldValues: {
    select: {
      value: true,
      fieldDefinition: { select: { key: true } },
    },
  },
  terms: {
    select: {
      term: {
        select: {
          id: true,
          name: true,
          slug: true,
          taxonomy: { select: { slug: true, name: true } },
        },
      },
    },
    orderBy: { sortOrder: "asc" as const },
  },
  mediaAttachments: {
    where: { role: "featured_image" },
    select: {
      mediaAsset: {
        select: { id: true, url: true, alt: true, width: true, height: true },
      },
    },
    take: 1,
  },
  _count: { select: { revisions: true } },
} as const;
