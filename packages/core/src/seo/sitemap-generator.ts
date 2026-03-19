/**
 * Sitemap Generator
 *
 * Produces XML sitemaps from published content.
 * For large sites (>1000 URLs), generates a sitemap index
 * pointing to paginated sub-sitemaps.
 */

import { prisma } from "@nextpress/db";
import type { SitemapEntry } from "./seo-types";

const URLS_PER_SITEMAP = 1000;

export const sitemapGenerator = {
  /**
   * Generate the complete sitemap XML for a site.
   * If > 1000 URLs, returns a sitemap index.
   */
  async generate(siteId: string, siteUrl: string): Promise<string> {
    const totalEntries = await prisma.contentEntry.count({
      where: { siteId, status: "PUBLISHED" },
    });

    if (totalEntries <= URLS_PER_SITEMAP) {
      return this.generateSingleSitemap(siteId, siteUrl, 0);
    }

    // Sitemap index
    const pageCount = Math.ceil(totalEntries / URLS_PER_SITEMAP);
    const sitemaps = Array.from({ length: pageCount }, (_, i) =>
      `<sitemap><loc>${siteUrl}/sitemap-${i + 1}.xml</loc><lastmod>${new Date().toISOString()}</lastmod></sitemap>`,
    );

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.join("\n")}
</sitemapindex>`;
  },

  /**
   * Generate a single sitemap page.
   */
  async generateSingleSitemap(
    siteId: string,
    siteUrl: string,
    page: number,
  ): Promise<string> {
    const entries = await prisma.contentEntry.findMany({
      where: { siteId, status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      skip: page * URLS_PER_SITEMAP,
      take: URLS_PER_SITEMAP,
      select: {
        slug: true,
        updatedAt: true,
        contentType: { select: { slug: true } },
      },
    });

    const urls: SitemapEntry[] = [
      // Homepage
      {
        loc: siteUrl,
        lastmod: new Date().toISOString(),
        changefreq: "daily",
        priority: 1.0,
      },
    ];

    for (const entry of entries) {
      const path = entry.contentType.slug === "page"
        ? `/${entry.slug}`
        : `/${entry.contentType.slug}/${entry.slug}`;

      urls.push({
        loc: `${siteUrl}${path}`,
        lastmod: entry.updatedAt.toISOString(),
        changefreq: "weekly",
        priority: entry.contentType.slug === "page" ? 0.8 : 0.6,
      });
    }

    // Add taxonomy archives
    const taxonomies = await prisma.term.findMany({
      where: { taxonomy: { siteId } },
      select: {
        slug: true,
        taxonomy: { select: { slug: true } },
      },
    });

    for (const term of taxonomies) {
      urls.push({
        loc: `${siteUrl}/${term.taxonomy.slug}/${term.slug}`,
        lastmod: new Date().toISOString(),
        changefreq: "weekly",
        priority: 0.5,
      });
    }

    return buildSitemapXml(urls);
  },
};

function buildSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map(
      (e) => `  <url>
    <loc>${escapeXml(e.loc)}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
