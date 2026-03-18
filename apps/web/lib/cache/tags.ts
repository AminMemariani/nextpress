export const CacheTags = {
  content: (id: string) => `content:${id}` as const,
  contentList: (type: string, siteId: string) => `content-list:${type}:${siteId}` as const,
  contentTypes: (siteId: string) => `content-types:${siteId}` as const,
  taxonomy: (slug: string, siteId: string) => `taxonomy:${slug}:${siteId}` as const,
  menu: (location: string, siteId: string) => `menu:${location}:${siteId}` as const,
  settings: (siteId: string) => `settings:${siteId}` as const,
  site: (id: string) => `site:${id}` as const,
} as const;
