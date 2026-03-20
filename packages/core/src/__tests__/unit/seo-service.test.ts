import { describe, it, expect, beforeEach } from "vitest";
import { seoService } from "../../seo/seo-service";
import { hooks } from "../../hooks/hook-engine";
import type { ContentEntryDto } from "../../content/content-types";
import type { SeoDefaults } from "../../seo/seo-types";

beforeEach(() => {
  hooks.reset();
});

const defaults: SeoDefaults = {
  titleSeparator: "|",
  siteName: "My Site",
  siteDescription: "A test site",
  siteUrl: "https://example.com",
  defaultOgImage: "https://example.com/og.jpg",
  robotsDefault: { index: true, follow: true },
};

const baseEntry: ContentEntryDto = {
  id: "e1",
  siteId: "s1",
  contentType: { id: "ct1", slug: "post", nameSingular: "Post" },
  status: "PUBLISHED",
  title: "My Post",
  slug: "my-post",
  excerpt: "A summary",
  blocks: [],
  password: null,
  author: { id: "u1", name: "John", displayName: "John Doe", image: null },
  parentId: null,
  menuOrder: 0,
  template: null,
  publishedAt: new Date("2025-03-01T12:00:00Z"),
  scheduledAt: null,
  createdAt: new Date("2025-02-28"),
  updatedAt: new Date("2025-03-01T15:00:00Z"),
  fields: {},
  terms: [{ id: "t1", name: "JS", slug: "js", taxonomy: { slug: "tag", name: "Tag" } }],
  featuredImage: { id: "m1", url: "https://img.com/photo.jpg", alt: "Photo", width: 800, height: 600 },
  revisionCount: 1,
};

describe("seoService.buildDefaults", () => {
  it("uses domain for siteUrl when available", () => {
    const d = seoService.buildDefaults({ name: "Site", tagline: "Tag", domain: "example.com", slug: "site" });
    expect(d.siteUrl).toBe("https://example.com");
  });

  it("falls back to slug-based URL when no domain", () => {
    const d = seoService.buildDefaults({ name: "Site", tagline: "Tag", domain: null, slug: "mysite" });
    expect(d.siteUrl).toBe("https://mysite.nextpress.app");
  });

  it("uses settings titleSeparator", () => {
    const d = seoService.buildDefaults(
      { name: "Site", tagline: null, domain: null, slug: "s" },
      { titleSeparator: "-" },
    );
    expect(d.titleSeparator).toBe("-");
  });

  it("defaults titleSeparator to pipe", () => {
    const d = seoService.buildDefaults({ name: "Site", tagline: null, domain: null, slug: "s" });
    expect(d.titleSeparator).toBe("|");
  });

  it("uses tagline for siteDescription", () => {
    const d = seoService.buildDefaults({ name: "Site", tagline: "My tagline", domain: null, slug: "s" });
    expect(d.siteDescription).toBe("My tagline");
  });

  it("defaults siteDescription to empty string for null tagline", () => {
    const d = seoService.buildDefaults({ name: "Site", tagline: null, domain: null, slug: "s" });
    expect(d.siteDescription).toBe("");
  });

  it("sets defaultOgImage from settings", () => {
    const d = seoService.buildDefaults(
      { name: "Site", tagline: null, domain: null, slug: "s" },
      { socialImage: "https://img.com/og.png" },
    );
    expect(d.defaultOgImage).toBe("https://img.com/og.png");
  });

  it("defaults defaultOgImage to null", () => {
    const d = seoService.buildDefaults({ name: "Site", tagline: null, domain: null, slug: "s" });
    expect(d.defaultOgImage).toBeNull();
  });
});

describe("seoService.buildHomeMetadata", () => {
  it("builds title with site name and description", () => {
    const meta = seoService.buildHomeMetadata(defaults);
    expect(meta.title).toBe("My Site | A test site");
  });

  it("sets canonical to siteUrl", () => {
    const meta = seoService.buildHomeMetadata(defaults);
    expect(meta.canonical).toBe("https://example.com");
  });

  it("uses defaultOgImage when available", () => {
    const meta = seoService.buildHomeMetadata(defaults);
    expect(meta.openGraph.images).toHaveLength(1);
    expect(meta.openGraph.images[0].url).toBe("https://example.com/og.jpg");
  });

  it("omits OG images when no default", () => {
    const meta = seoService.buildHomeMetadata({ ...defaults, defaultOgImage: null });
    expect(meta.openGraph.images).toHaveLength(0);
  });

  it("sets type to website", () => {
    const meta = seoService.buildHomeMetadata(defaults);
    expect(meta.openGraph.type).toBe("website");
  });
});

describe("seoService.buildTaxonomyMetadata", () => {
  it("builds title with term name", () => {
    const meta = seoService.buildTaxonomyMetadata(
      { name: "JavaScript", slug: "javascript", taxonomy: "tag" },
      defaults,
    );
    expect(meta.title).toBe("JavaScript | My Site");
  });

  it("builds description with taxonomy name", () => {
    const meta = seoService.buildTaxonomyMetadata(
      { name: "JavaScript", slug: "javascript", taxonomy: "tag" },
      defaults,
    );
    expect(meta.description).toBe("Browse tag: JavaScript");
  });

  it("builds canonical URL", () => {
    const meta = seoService.buildTaxonomyMetadata(
      { name: "JavaScript", slug: "javascript", taxonomy: "tag" },
      defaults,
    );
    expect(meta.canonical).toBe("https://example.com/tag/javascript");
  });

  it("sets twitter card to summary", () => {
    const meta = seoService.buildTaxonomyMetadata(
      { name: "JS", slug: "js", taxonomy: "tag" },
      defaults,
    );
    expect(meta.twitter.card).toBe("summary");
  });
});

describe("seoService.buildEntryMetadata", () => {
  it("builds title with entry title and site name", async () => {
    const meta = await seoService.buildEntryMetadata(baseEntry, defaults);
    expect(meta.title).toBe("My Post | My Site");
  });

  it("uses _seo_title override", async () => {
    const entry = { ...baseEntry, fields: { _seo_title: "Custom SEO Title" } };
    const meta = await seoService.buildEntryMetadata(entry, defaults);
    expect(meta.title).toBe("Custom SEO Title | My Site");
  });

  it("uses excerpt as description", async () => {
    const meta = await seoService.buildEntryMetadata(baseEntry, defaults);
    expect(meta.description).toBe("A summary");
  });

  it("uses _seo_description override", async () => {
    const entry = { ...baseEntry, fields: { _seo_description: "SEO desc" } };
    const meta = await seoService.buildEntryMetadata(entry, defaults);
    expect(meta.description).toBe("SEO desc");
  });

  it("falls back to siteDescription when no excerpt", async () => {
    const entry = { ...baseEntry, excerpt: null, fields: {} };
    const meta = await seoService.buildEntryMetadata(entry, defaults);
    expect(meta.description).toBe("A test site");
  });

  it("uses featured image for OG", async () => {
    const meta = await seoService.buildEntryMetadata(baseEntry, defaults);
    expect(meta.openGraph.images).toHaveLength(1);
    expect(meta.openGraph.images[0].url).toBe("https://img.com/photo.jpg");
  });

  it("falls back to defaultOgImage when no featured image", async () => {
    const entry = { ...baseEntry, featuredImage: null };
    const meta = await seoService.buildEntryMetadata(entry, defaults);
    expect(meta.openGraph.images[0].url).toBe("https://example.com/og.jpg");
  });

  it("sets article metadata for posts", async () => {
    const meta = await seoService.buildEntryMetadata(baseEntry, defaults);
    expect(meta.openGraph.type).toBe("article");
    expect(meta.openGraph.article).toBeDefined();
    expect(meta.openGraph.article!.authors).toContain("John Doe");
    expect(meta.openGraph.article!.tags).toContain("JS");
  });

  it("sets website type for pages", async () => {
    const page = { ...baseEntry, contentType: { id: "ct2", slug: "page", nameSingular: "Page" } };
    const meta = await seoService.buildEntryMetadata(page, defaults);
    expect(meta.openGraph.type).toBe("website");
    expect(meta.openGraph.article).toBeUndefined();
  });

  it("sets twitter card based on image presence", async () => {
    const meta = await seoService.buildEntryMetadata(baseEntry, defaults);
    expect(meta.twitter.card).toBe("summary_large_image");
  });

  it("uses _seo_robots override", async () => {
    const entry = { ...baseEntry, fields: { _seo_robots: "noindex, nofollow" } };
    const meta = await seoService.buildEntryMetadata(entry, defaults);
    expect(meta.robots).toEqual({ index: false, follow: false });
  });

  it("uses _seo_canonical override", async () => {
    const entry = { ...baseEntry, fields: { _seo_canonical: "https://other.com/page" } };
    const meta = await seoService.buildEntryMetadata(entry, defaults);
    expect(meta.canonical).toBe("https://other.com/page");
  });
});
