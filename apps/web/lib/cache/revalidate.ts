import "server-only";

import { revalidateTag } from "next/cache";
import { CacheTags } from "./tags";

/** Revalidate caches when a content entry changes */
export function onContentChange(entryId: string, typeSlug: string, siteId: string) {
  revalidateTag(CacheTags.content(entryId));
  revalidateTag(CacheTags.contentList(typeSlug, siteId));
}

/** Revalidate when content type definitions change */
export function onContentTypeChange(siteId: string) {
  revalidateTag(CacheTags.contentTypes(siteId));
}

/** Revalidate when taxonomy/terms change */
export function onTaxonomyChange(slug: string, siteId: string) {
  revalidateTag(CacheTags.taxonomy(slug, siteId));
}

/** Revalidate when a menu changes */
export function onMenuChange(location: string, siteId: string) {
  revalidateTag(CacheTags.menu(location, siteId));
}

/** Revalidate when settings change */
export function onSettingsChange(siteId: string) {
  revalidateTag(CacheTags.settings(siteId));
}
