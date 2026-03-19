/**
 * Search Types
 *
 * Supports two search backends:
 *   1. PostgreSQL full-text search (MVP, zero infrastructure)
 *   2. External search engine (scalable: Meilisearch, Typesense, Algolia)
 *
 * The SearchProvider interface abstracts the backend. The service
 * always calls the same methods regardless of which backend is active.
 */

import { z } from "zod";
import { paginationSchema } from "../validation/schemas";

// ── Search input ──

export const searchInputSchema = paginationSchema.extend({
  query: z.string().min(1).max(500),
  contentTypeSlug: z.string().optional(),
  status: z.enum(["PUBLISHED", "DRAFT", "PENDING_REVIEW", "SCHEDULED", "PRIVATE", "ARCHIVED", "TRASH"]).optional(),
  taxonomySlugs: z.array(z.string()).optional(),
  termIds: z.array(z.string().cuid()).optional(),
  authorId: z.string().cuid().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
});

export type SearchInput = z.infer<typeof searchInputSchema>;

// ── Search result ──

export interface SearchResult {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  contentTypeSlug: string;
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
  author: { name: string | null; displayName: string | null };
  /** Relevance score (higher = better match) */
  score: number;
  /** Highlighted snippet showing where the query matched */
  highlight: string | null;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  query: string;
  /** Search execution time in milliseconds */
  durationMs: number;
}

// ── Search provider interface (for future external backends) ──

export interface SearchProvider {
  search(siteId: string, input: SearchInput): Promise<SearchResponse>;
  index(siteId: string, entry: IndexableEntry): Promise<void>;
  remove(siteId: string, entryId: string): Promise<void>;
  reindexAll(siteId: string): Promise<{ indexed: number }>;
}

/** Data needed to index a content entry */
export interface IndexableEntry {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  /** Plain text extracted from blocks (for full content search) */
  bodyText: string;
  contentTypeSlug: string;
  status: string;
  authorName: string;
  termNames: string[];
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
