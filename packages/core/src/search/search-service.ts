/**
 * Search Service
 *
 * Two modes controlled by SEARCH_PROVIDER env var:
 *
 *   "postgres" (default, MVP):
 *     Uses PostgreSQL tsvector + GIN index for full-text search.
 *     Zero additional infrastructure. Fast enough for most CMS sites
 *     (< 100k entries). Weighted ranking: title (A) > excerpt (B).
 *
 *   "external" (scalable):
 *     Delegates to an external search engine via the SearchProvider
 *     interface. Supports typo tolerance, faceted filtering, synonyms,
 *     and vector/semantic search. Requires additional infrastructure.
 *
 * The service also provides a helper to extract plain text from block
 * data, which is used for indexing block content in the external mode.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@nextpress/db";
import type {
  SearchInput,
  SearchResponse,
  SearchResult,
  SearchProvider,
  IndexableEntry,
} from "./search-types";
import { searchInputSchema } from "./search-types";
import type { BlockData } from "../validation/schemas";

// ── Search provider selection ──

let externalProvider: SearchProvider | null = null;

export function setSearchProvider(provider: SearchProvider) {
  externalProvider = provider;
}

// ── Main search service ──

export const searchService = {
  /**
   * Search content entries.
   * Routes to PostgreSQL or external provider based on config.
   */
  async search(siteId: string, input: SearchInput): Promise<SearchResponse> {
    const parsed = searchInputSchema.parse(input);

    if (externalProvider) {
      return externalProvider.search(siteId, parsed);
    }

    return postgresSearch(siteId, parsed);
  },

  /**
   * Index a content entry for search.
   * For PostgreSQL: no-op (trigger handles it).
   * For external: sends data to the search engine.
   */
  async index(siteId: string, entry: IndexableEntry): Promise<void> {
    if (externalProvider) {
      await externalProvider.index(siteId, entry);
    }
    // PostgreSQL: trigger auto-updates tsvector on INSERT/UPDATE
  },

  /**
   * Remove an entry from the search index.
   */
  async remove(siteId: string, entryId: string): Promise<void> {
    if (externalProvider) {
      await externalProvider.remove(siteId, entryId);
    }
    // PostgreSQL: row deletion handles it
  },

  /**
   * Extract plain text from BlockData[] for indexing.
   * Strips HTML, concatenates all text content.
   */
  extractTextFromBlocks(blocks: BlockData[]): string {
    const parts: string[] = [];

    function walk(blockList: BlockData[]) {
      for (const block of blockList) {
        // Extract text from common block attributes
        const attrs = block.attributes;
        if (typeof attrs.content === "string") {
          parts.push(stripHtml(attrs.content));
        }
        if (typeof attrs.text === "string") {
          parts.push(attrs.text);
        }
        if (typeof attrs.caption === "string") {
          parts.push(attrs.caption);
        }
        if (typeof attrs.citation === "string") {
          parts.push(attrs.citation);
        }
        // Recurse into inner blocks
        if (block.innerBlocks?.length) {
          walk(block.innerBlocks);
        }
      }
    }

    walk(blocks);
    return parts.join(" ").replace(/\s+/g, " ").trim();
  },

  /**
   * Build an IndexableEntry from a content entry (for external indexing).
   */
  async buildIndexableEntry(entryId: string): Promise<IndexableEntry | null> {
    const entry = await prisma.contentEntry.findUnique({
      where: { id: entryId },
      select: {
        id: true, title: true, slug: true, excerpt: true, blocks: true,
        status: true, publishedAt: true, createdAt: true, updatedAt: true,
        contentType: { select: { slug: true } },
        author: { select: { name: true, displayName: true } },
        terms: { select: { term: { select: { name: true } } } },
      },
    });
    if (!entry) return null;

    return {
      id: entry.id,
      title: entry.title,
      slug: entry.slug,
      excerpt: entry.excerpt,
      bodyText: this.extractTextFromBlocks(entry.blocks as BlockData[]),
      contentTypeSlug: entry.contentType.slug,
      status: entry.status,
      authorName: entry.author.displayName ?? entry.author.name ?? "",
      termNames: entry.terms.map((t: any) => t.term.name),
      publishedAt: entry.publishedAt,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
  },
};

// ── PostgreSQL Full-Text Search ──

async function postgresSearch(
  siteId: string,
  input: SearchInput,
): Promise<SearchResponse> {
  const start = Date.now();
  const { query, page, perPage, contentTypeSlug, status, termIds, authorId, dateFrom, dateTo } = input;
  const offset = (page - 1) * perPage;

  // Build the tsquery from user input
  // plainto_tsquery handles multi-word input safely (no injection)
  const tsQuery = Prisma.sql`plainto_tsquery('english', ${query})`;

  // Build WHERE conditions
  const conditions: Prisma.Sql[] = [
    Prisma.sql`ce.site_id = ${siteId}`,
    Prisma.sql`ce.search_vector @@ ${tsQuery}`,
  ];

  if (status) {
    conditions.push(Prisma.sql`ce.status = ${status}::"ContentStatus"`);
  } else {
    // Default: public search only shows published
    conditions.push(Prisma.sql`ce.status = 'PUBLISHED'::"ContentStatus"`);
  }

  if (contentTypeSlug) {
    conditions.push(
      Prisma.sql`ce.content_type_id = (SELECT id FROM content_types WHERE site_id = ${siteId} AND slug = ${contentTypeSlug})`,
    );
  }

  if (authorId) {
    conditions.push(Prisma.sql`ce.author_id = ${authorId}`);
  }

  if (dateFrom) {
    conditions.push(Prisma.sql`ce.created_at >= ${dateFrom}`);
  }

  if (dateTo) {
    conditions.push(Prisma.sql`ce.created_at <= ${dateTo}`);
  }

  const whereClause = Prisma.join(conditions, " AND ");

  // Term filtering via subquery
  let termFilter = Prisma.sql``;
  if (termIds?.length) {
    termFilter = Prisma.sql`AND ce.id IN (
      SELECT content_entry_id FROM content_terms WHERE term_id IN (${Prisma.join(termIds)})
    )`;
  }

  // Count total results
  const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count
    FROM content_entries ce
    WHERE ${whereClause} ${termFilter}
  `;
  const total = Number(countResult[0].count);

  // Fetch ranked results with highlights
  const results = await prisma.$queryRaw<Array<{
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content_type_slug: string;
    status: string;
    published_at: Date | null;
    created_at: Date;
    author_name: string | null;
    author_display_name: string | null;
    score: number;
    highlight: string | null;
  }>>`
    SELECT
      ce.id,
      ce.title,
      ce.slug,
      ce.excerpt,
      ct.slug as content_type_slug,
      ce.status,
      ce.published_at,
      ce.created_at,
      u.name as author_name,
      u.display_name as author_display_name,
      ts_rank(ce.search_vector, ${tsQuery}) as score,
      ts_headline('english', coalesce(ce.title, '') || ' ' || coalesce(ce.excerpt, ''),
        ${tsQuery}, 'MaxWords=30, MinWords=15, StartSel=<mark>, StopSel=</mark>'
      ) as highlight
    FROM content_entries ce
    JOIN content_types ct ON ct.id = ce.content_type_id
    JOIN users u ON u.id = ce.author_id
    WHERE ${whereClause} ${termFilter}
    ORDER BY score DESC, ce.published_at DESC NULLS LAST
    LIMIT ${perPage} OFFSET ${offset}
  `;

  const durationMs = Date.now() - start;

  return {
    results: results.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      excerpt: r.excerpt,
      contentTypeSlug: r.content_type_slug,
      status: r.status,
      publishedAt: r.published_at,
      createdAt: r.created_at,
      author: { name: r.author_name, displayName: r.author_display_name },
      score: r.score,
      highlight: r.highlight,
    })),
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
    query,
    durationMs,
  };
}

// ── Helpers ──

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/&[a-z]+;/g, " ");
}
