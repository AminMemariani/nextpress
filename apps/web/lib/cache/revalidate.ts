import "server-only";

/**
 * Revalidation Triggers
 *
 * Called by tRPC mutation handlers after successful writes.
 * Each function invalidates the exact set of cache tags affected
 * by that type of change. No over-invalidation.
 *
 * Why call revalidateTag here instead of in the service layer?
 *   - revalidateTag is a Next.js API, not available in packages/core
 *   - The service layer is framework-agnostic (no Next.js imports)
 *   - The tRPC router in apps/web IS the Next.js boundary
 */

import { revalidateTag } from "next/cache";
import { CacheTags } from "./tags";

/**
 * Content entry published or updated.
 * Invalidates: the entry page, the content type list, homepage, sitemap, feed.
 */
export function onContentPublished(
  entryId: string,
  typeSlug: string,
  siteId: string,
  termSlugs: string[] = [],
) {
  revalidateTag(CacheTags.content(entryId));
  revalidateTag(CacheTags.contentList(typeSlug, siteId));
  revalidateTag(CacheTags.homepage(siteId));
  revalidateTag(CacheTags.sitemap(siteId));
  revalidateTag(CacheTags.feed(siteId));

  // Invalidate taxonomy archive pages for every term on this entry
  for (const slug of termSlugs) {
    revalidateTag(CacheTags.taxonomy(slug, siteId));
  }
}

/**
 * Content entry unpublished (trashed, archived, reverted to draft).
 * Same invalidation as publish — the entry disappears from lists.
 */
export function onContentUnpublished(
  entryId: string,
  typeSlug: string,
  siteId: string,
  termSlugs: string[] = [],
) {
  onContentPublished(entryId, typeSlug, siteId, termSlugs);
}

/**
 * Content entry updated (but status didn't change).
 * Invalidates: the entry page only. Lists show title/excerpt which may change.
 */
export function onContentUpdated(
  entryId: string,
  typeSlug: string,
  siteId: string,
) {
  revalidateTag(CacheTags.content(entryId));
  revalidateTag(CacheTags.contentList(typeSlug, siteId));
}

/**
 * Content entry permanently deleted.
 */
export function onContentDeleted(
  entryId: string,
  typeSlug: string,
  siteId: string,
) {
  revalidateTag(CacheTags.content(entryId));
  revalidateTag(CacheTags.contentList(typeSlug, siteId));
  revalidateTag(CacheTags.homepage(siteId));
  revalidateTag(CacheTags.sitemap(siteId));
  revalidateTag(CacheTags.feed(siteId));
}

/** Taxonomy or terms changed */
export function onTaxonomyChange(slug: string, siteId: string) {
  revalidateTag(CacheTags.taxonomy(slug, siteId));
}

/** Menu items changed */
export function onMenuChange(location: string, siteId: string) {
  revalidateTag(CacheTags.menu(location, siteId));
}

/** Site settings changed */
export function onSettingsChange(siteId: string) {
  revalidateTag(CacheTags.settings(siteId));
  revalidateTag(CacheTags.site(siteId));
}

/** Content type definitions changed */
export function onContentTypeChange(siteId: string) {
  revalidateTag(CacheTags.contentTypes(siteId));
}
