/**
 * Structured Data — JSON-LD generation
 *
 * Generates schema.org structured data for content entries.
 * Injected into <head> via Next.js metadata `other` field
 * or rendered as a <script type="application/ld+json"> component.
 */

import type { ContentEntryDto } from "../content/content-types";
import type { SeoDefaults } from "./seo-types";

/**
 * Generate JSON-LD for a single content entry.
 */
export function buildEntryStructuredData(
  entry: ContentEntryDto,
  defaults: SeoDefaults,
): Record<string, unknown> {
  const isArticle = entry.contentType.slug === "post";
  const url = `${defaults.siteUrl}/${entry.slug}`;

  if (isArticle) {
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: entry.title,
      description: entry.excerpt ?? "",
      url,
      datePublished: entry.publishedAt?.toISOString(),
      dateModified: entry.updatedAt.toISOString(),
      author: {
        "@type": "Person",
        name: entry.author.displayName ?? entry.author.name ?? "Unknown",
      },
      publisher: {
        "@type": "Organization",
        name: defaults.siteName,
        url: defaults.siteUrl,
      },
      ...(entry.featuredImage && {
        image: {
          "@type": "ImageObject",
          url: entry.featuredImage.url,
          width: entry.featuredImage.width,
          height: entry.featuredImage.height,
        },
      }),
      ...(entry.terms.length > 0 && {
        keywords: entry.terms.map((t) => t.name).join(", "),
      }),
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": url,
      },
    };
  }

  // Generic WebPage for pages and other types
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: entry.title,
    description: entry.excerpt ?? "",
    url,
    datePublished: entry.publishedAt?.toISOString(),
    dateModified: entry.updatedAt.toISOString(),
    isPartOf: {
      "@type": "WebSite",
      name: defaults.siteName,
      url: defaults.siteUrl,
    },
  };
}

/**
 * Generate JSON-LD for the homepage (WebSite + SearchAction).
 */
export function buildSiteStructuredData(
  defaults: SeoDefaults,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: defaults.siteName,
    description: defaults.siteDescription,
    url: defaults.siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${defaults.siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Generate BreadcrumbList JSON-LD.
 */
export function buildBreadcrumbStructuredData(
  items: Array<{ name: string; url: string }>,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
