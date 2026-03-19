/**
 * Sitemap XML generation for the SEO plugin.
 * Called via the plugin's registered API route.
 */

export async function generateSitemap(siteId: string): Promise<string> {
  // In production, this would query published content and build XML
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>
</urlset>`;
}
