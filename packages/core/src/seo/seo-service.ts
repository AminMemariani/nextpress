/**
 * SEO Service
 *
 * Builds metadata for any page in the CMS. Produces a SeoMetadata
 * object that maps directly to Next.js's Metadata type.
 *
 * Resolution order for each field:
 *   1. Per-entry SEO field override (fields._seo_title, etc.)
 *   2. Entry data (title, excerpt, featured image)
 *   3. Site-wide defaults (settings)
 *   4. Hardcoded fallbacks
 *
 * After building, the result is passed through the "render:meta_tags"
 * hook so plugins can modify it (e.g., the SEO Toolkit plugin).
 */

import { hooks } from "../hooks/hook-engine";
import type { ContentEntryDto } from "../content/content-types";
import type { SeoMetadata, SeoDefaults, OgImage } from "./seo-types";

export const seoService = {
  /**
   * Build metadata for a single content entry.
   */
  async buildEntryMetadata(
    entry: ContentEntryDto,
    defaults: SeoDefaults,
  ): Promise<SeoMetadata> {
    const fields = entry.fields ?? {};
    const sep = defaults.titleSeparator;

    // Title: SEO override → entry title + site name
    const rawTitle = (fields._seo_title as string) || entry.title;
    const title = `${rawTitle} ${sep} ${defaults.siteName}`;

    // Description: SEO override → excerpt → site description
    const description =
      (fields._seo_description as string) ||
      entry.excerpt ||
      defaults.siteDescription;

    // Canonical: SEO override → default URL
    const defaultUrl = `${defaults.siteUrl}/${entry.slug}`;
    const canonical = (fields._seo_canonical as string) || defaultUrl;

    // Robots: SEO override → defaults
    const robotsStr = fields._seo_robots as string | undefined;
    const robots = robotsStr
      ? parseRobots(robotsStr)
      : defaults.robotsDefault;

    // OG Image: featured image → default OG image
    const ogImages: OgImage[] = [];
    if (entry.featuredImage) {
      ogImages.push({
        url: entry.featuredImage.url,
        width: entry.featuredImage.width ?? undefined,
        height: entry.featuredImage.height ?? undefined,
        alt: entry.featuredImage.alt ?? entry.title,
      });
    } else if (defaults.defaultOgImage) {
      ogImages.push({ url: defaults.defaultOgImage });
    }

    // Article metadata for posts
    const isArticle = entry.contentType.slug === "post";
    const article = isArticle
      ? {
          publishedTime: entry.publishedAt?.toISOString() ?? entry.createdAt.toISOString(),
          modifiedTime: entry.updatedAt.toISOString(),
          authors: [entry.author.displayName ?? entry.author.name ?? "Unknown"],
          tags: entry.terms.map((t) => t.name),
        }
      : undefined;

    const metadata: SeoMetadata = {
      title,
      description,
      canonical,
      robots,
      openGraph: {
        title: rawTitle,
        description,
        type: isArticle ? "article" : "website",
        url: canonical,
        siteName: defaults.siteName,
        images: ogImages,
        article,
      },
      twitter: {
        card: ogImages.length > 0 ? "summary_large_image" : "summary",
        title: rawTitle,
        description,
        images: ogImages.map((img) => img.url),
      },
      alternates: { canonical },
      other: {},
    };

    // Run through plugin filters
    const filtered = await hooks.applyFilters(
      "render:meta_tags",
      metadata as any,
      entry,
    );

    return filtered as unknown as SeoMetadata;
  },

  /**
   * Build metadata for the homepage.
   */
  buildHomeMetadata(defaults: SeoDefaults): SeoMetadata {
    return {
      title: `${defaults.siteName} ${defaults.titleSeparator} ${defaults.siteDescription}`,
      description: defaults.siteDescription,
      canonical: defaults.siteUrl,
      robots: defaults.robotsDefault,
      openGraph: {
        title: defaults.siteName,
        description: defaults.siteDescription,
        type: "website",
        url: defaults.siteUrl,
        siteName: defaults.siteName,
        images: defaults.defaultOgImage
          ? [{ url: defaults.defaultOgImage }]
          : [],
      },
      twitter: {
        card: "summary_large_image",
        title: defaults.siteName,
        description: defaults.siteDescription,
        images: defaults.defaultOgImage ? [defaults.defaultOgImage] : [],
      },
      alternates: { canonical: defaults.siteUrl },
      other: {},
    };
  },

  /**
   * Build metadata for a taxonomy archive page.
   */
  buildTaxonomyMetadata(
    term: { name: string; slug: string; taxonomy: string },
    defaults: SeoDefaults,
  ): SeoMetadata {
    const title = `${term.name} ${defaults.titleSeparator} ${defaults.siteName}`;
    const description = `Browse ${term.taxonomy}: ${term.name}`;
    const url = `${defaults.siteUrl}/${term.taxonomy}/${term.slug}`;

    return {
      title,
      description,
      canonical: url,
      robots: defaults.robotsDefault,
      openGraph: {
        title: term.name,
        description,
        type: "website",
        url,
        siteName: defaults.siteName,
        images: defaults.defaultOgImage
          ? [{ url: defaults.defaultOgImage }]
          : [],
      },
      twitter: {
        card: "summary",
        title: term.name,
        description,
        images: [],
      },
      alternates: { canonical: url },
      other: {},
    };
  },

  /**
   * Build SeoDefaults from a Site record + Settings.
   */
  buildDefaults(
    site: { name: string; tagline: string | null; domain: string | null; slug: string },
    settings?: Record<string, unknown>,
  ): SeoDefaults {
    const siteUrl = site.domain
      ? `https://${site.domain}`
      : `https://${site.slug}.nextpress.app`;

    return {
      titleSeparator: (settings?.titleSeparator as string) ?? "|",
      siteName: site.name,
      siteDescription: site.tagline ?? "",
      siteUrl,
      defaultOgImage: (settings?.socialImage as string) ?? null,
      robotsDefault: { index: true, follow: true },
    };
  },
};

function parseRobots(str: string): { index: boolean; follow: boolean } {
  const parts = str.toLowerCase().split(",").map((s) => s.trim());
  return {
    index: !parts.includes("noindex"),
    follow: !parts.includes("nofollow"),
  };
}
