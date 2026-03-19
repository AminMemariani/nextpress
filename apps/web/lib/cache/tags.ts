/**
 * Cache Tag Registry
 *
 * Every cached query is tagged so it can be surgically invalidated.
 * Tags follow a hierarchical naming convention:
 *
 *   content:{id}                   → single entry page
 *   content-list:{type}:{siteId}   → list pages for a content type
 *   taxonomy:{slug}:{siteId}       → taxonomy archive pages
 *   menu:{location}:{siteId}       → navigation menus
 *   settings:{siteId}              → site settings
 *   site:{siteId}                  → site-wide data (name, tagline)
 *   homepage:{siteId}              → homepage specifically
 *   sitemap:{siteId}               → XML sitemap
 *   feed:{siteId}                  → RSS feed
 *
 * Revalidation granularity:
 *   - Publishing a post invalidates: content:{id}, content-list:{type}, homepage, sitemap, feed
 *   - Changing a term invalidates: taxonomy:{slug}, content-list (entries may be filtered by term)
 *   - Changing a menu invalidates: menu:{location} (affects every page with that menu)
 *   - Changing settings invalidates: settings, site (affects all pages)
 */

export const CacheTags = {
  content: (id: string) => `content:${id}` as const,
  contentList: (type: string, siteId: string) => `content-list:${type}:${siteId}` as const,
  contentTypes: (siteId: string) => `content-types:${siteId}` as const,
  taxonomy: (slug: string, siteId: string) => `taxonomy:${slug}:${siteId}` as const,
  menu: (location: string, siteId: string) => `menu:${location}:${siteId}` as const,
  settings: (siteId: string) => `settings:${siteId}` as const,
  site: (id: string) => `site:${id}` as const,
  homepage: (siteId: string) => `homepage:${siteId}` as const,
  sitemap: (siteId: string) => `sitemap:${siteId}` as const,
  feed: (siteId: string) => `feed:${siteId}` as const,
} as const;
