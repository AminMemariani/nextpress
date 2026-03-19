import "server-only";

/**
 * Content-specific revalidation helpers.
 *
 * Called by the tRPC content router after mutations.
 * Inspects the result DTO to determine which tags to invalidate.
 */

import { revalidateTag } from "next/cache";
import { CacheTags } from "./tags";
import type { ContentEntryDto } from "@nextpress/core/content/content-types";

/**
 * Revalidate all tags affected by a content entry change.
 * Call this after create, update, publish, trash, delete.
 */
export function revalidateForEntry(entry: ContentEntryDto) {
  const siteId = entry.siteId;
  const typeSlug = entry.contentType.slug;
  const termSlugs = entry.terms.map((t) => t.taxonomy.slug);

  // The entry itself
  revalidateTag(CacheTags.content(entry.id));

  // The list page for this content type
  revalidateTag(CacheTags.contentList(typeSlug, siteId));

  // The catch-all list
  revalidateTag(CacheTags.contentList("_all", siteId));

  // Homepage (shows latest entries)
  revalidateTag(CacheTags.homepage(siteId));

  // Sitemap and feed (entry appeared/disappeared)
  revalidateTag(CacheTags.sitemap(siteId));
  revalidateTag(CacheTags.feed(siteId));

  // Taxonomy archive pages that include this entry
  const uniqueTaxonomies = new Set(termSlugs);
  for (const slug of uniqueTaxonomies) {
    revalidateTag(CacheTags.taxonomy(slug, siteId));
  }
}

/**
 * Revalidate after permanent content deletion.
 */
export function revalidateForDeletion(siteId: string, typeSlug: string) {
  revalidateTag(CacheTags.contentList(typeSlug, siteId));
  revalidateTag(CacheTags.contentList("_all", siteId));
  revalidateTag(CacheTags.homepage(siteId));
  revalidateTag(CacheTags.sitemap(siteId));
  revalidateTag(CacheTags.feed(siteId));
}
