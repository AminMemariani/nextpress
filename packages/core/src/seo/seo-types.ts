/**
 * SEO Types
 *
 * These types flow through the SEO pipeline:
 *   seoService.buildMetadata() → hooks.applyFilters("render:meta_tags") → Next.js Metadata API
 */

import type { ContentEntryDto } from "../content/content-types";

/** The complete SEO metadata for a page */
export interface SeoMetadata {
  title: string;
  description: string;
  canonical: string | null;
  robots: {
    index: boolean;
    follow: boolean;
  };
  openGraph: {
    title: string;
    description: string;
    type: "website" | "article";
    url: string;
    siteName: string;
    images: OgImage[];
    article?: {
      publishedTime: string;
      modifiedTime: string;
      authors: string[];
      tags: string[];
    };
  };
  twitter: {
    card: "summary" | "summary_large_image";
    title: string;
    description: string;
    images: string[];
  };
  alternates: {
    canonical: string | null;
  };
  other: Record<string, string>;
}

export interface OgImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

/** Site-wide SEO defaults (from Settings) */
export interface SeoDefaults {
  titleSeparator: string;
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  defaultOgImage: string | null;
  robotsDefault: { index: boolean; follow: boolean };
}

/** Redirect rule stored in Settings */
export interface RedirectRule {
  from: string;
  to: string;
  statusCode: 301 | 302;
  isRegex: boolean;
}

/** Sitemap entry */
export interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}
