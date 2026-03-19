import "server-only";

/**
 * Next.js Metadata API integration.
 *
 * Converts SeoMetadata from the SEO service into the Next.js Metadata type.
 * Used by generateMetadata() in page.tsx files.
 */

import type { Metadata } from "next";
import type { SeoMetadata, SeoDefaults } from "@nextpress/core/seo/seo-types";
import type { ContentEntryDto } from "@nextpress/core/content/content-types";
import { seoService } from "@nextpress/core/seo/seo-service";
import { buildEntryStructuredData, buildSiteStructuredData } from "@nextpress/core/seo/structured-data";
import { resolveSite } from "../site/resolve";
import { prisma } from "@nextpress/db";
import { headers } from "next/headers";

/**
 * Build Next.js Metadata for a content entry page.
 */
export async function buildEntryPageMetadata(
  entry: ContentEntryDto,
): Promise<Metadata> {
  const defaults = await getSeoDefaults();
  const seo = await seoService.buildEntryMetadata(entry, defaults);
  const structuredData = buildEntryStructuredData(entry, defaults);

  return seoToNextMetadata(seo, structuredData);
}

/**
 * Build Next.js Metadata for the homepage.
 */
export async function buildHomePageMetadata(): Promise<Metadata> {
  const defaults = await getSeoDefaults();
  const seo = seoService.buildHomeMetadata(defaults);
  const structuredData = buildSiteStructuredData(defaults);

  return seoToNextMetadata(seo, structuredData);
}

/**
 * Build Next.js Metadata for a taxonomy archive.
 */
export async function buildTaxonomyPageMetadata(
  term: { name: string; slug: string; taxonomy: string },
): Promise<Metadata> {
  const defaults = await getSeoDefaults();
  const seo = seoService.buildTaxonomyMetadata(term, defaults);

  return seoToNextMetadata(seo);
}

/**
 * Get SEO defaults from the current site.
 */
async function getSeoDefaults(): Promise<SeoDefaults> {
  const h = await headers();
  const site = await resolveSite(h);
  if (!site) {
    return seoService.buildDefaults({
      name: "NextPress",
      tagline: null,
      domain: null,
      slug: "default",
    });
  }

  // Load SEO settings from the SEO toolkit plugin (if active)
  const pluginInstall = await prisma.pluginInstall.findFirst({
    where: { siteId: site.id, slug: "seo-toolkit", isActive: true },
    select: { settings: true },
  });
  const seoSettings = (pluginInstall?.settings as Record<string, unknown>) ?? {};

  return seoService.buildDefaults(site, seoSettings);
}

/**
 * Convert SeoMetadata → Next.js Metadata type.
 */
function seoToNextMetadata(
  seo: SeoMetadata,
  structuredData?: Record<string, unknown>,
): Metadata {
  const metadata: Metadata = {
    title: seo.title,
    description: seo.description,
    robots: {
      index: seo.robots.index,
      follow: seo.robots.follow,
    },
    openGraph: {
      title: seo.openGraph.title,
      description: seo.openGraph.description,
      type: seo.openGraph.type,
      url: seo.openGraph.url,
      siteName: seo.openGraph.siteName,
      images: seo.openGraph.images.map((img) => ({
        url: img.url,
        width: img.width,
        height: img.height,
        alt: img.alt,
      })),
      ...(seo.openGraph.article && {
        publishedTime: seo.openGraph.article.publishedTime,
        modifiedTime: seo.openGraph.article.modifiedTime,
        authors: seo.openGraph.article.authors,
        tags: seo.openGraph.article.tags,
      }),
    },
    twitter: {
      card: seo.twitter.card,
      title: seo.twitter.title,
      description: seo.twitter.description,
      images: seo.twitter.images,
    },
    alternates: {
      canonical: seo.alternates.canonical,
    },
  };

  // Inject JSON-LD as a metadata script (Next.js 14+ pattern)
  if (structuredData) {
    (metadata as any).other = {
      ...seo.other,
      "script:ld+json": JSON.stringify(structuredData),
    };
  }

  return metadata;
}
