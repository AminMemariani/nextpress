import { describe, it, expect } from "vitest";
import {
  buildEntryStructuredData,
  buildSiteStructuredData,
  buildBreadcrumbStructuredData,
} from "../../seo/structured-data";
import type { ContentEntryDto } from "../../content/content-types";
import type { SeoDefaults } from "../../seo/seo-types";

const defaults: SeoDefaults = {
  titleSeparator: "|",
  siteName: "My Site",
  siteDescription: "A test site",
  siteUrl: "https://example.com",
  defaultOgImage: null,
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
  terms: [],
  featuredImage: null,
  revisionCount: 1,
};

describe("buildEntryStructuredData", () => {
  it("returns Article type for posts", () => {
    const data = buildEntryStructuredData(baseEntry, defaults);
    expect(data["@type"]).toBe("Article");
    expect(data["@context"]).toBe("https://schema.org");
  });

  it("uses entry title as headline", () => {
    const data = buildEntryStructuredData(baseEntry, defaults);
    expect(data.headline).toBe("My Post");
  });

  it("uses excerpt as description", () => {
    const data = buildEntryStructuredData(baseEntry, defaults);
    expect(data.description).toBe("A summary");
  });

  it("uses empty string when excerpt is null", () => {
    const data = buildEntryStructuredData({ ...baseEntry, excerpt: null }, defaults);
    expect(data.description).toBe("");
  });

  it("builds correct URL", () => {
    const data = buildEntryStructuredData(baseEntry, defaults);
    expect(data.url).toBe("https://example.com/my-post");
  });

  it("includes author info", () => {
    const data = buildEntryStructuredData(baseEntry, defaults);
    expect((data.author as any).name).toBe("John Doe");
  });

  it("falls back to author.name when displayName is null", () => {
    const entry = { ...baseEntry, author: { ...baseEntry.author, displayName: null } };
    const data = buildEntryStructuredData(entry, defaults);
    expect((data.author as any).name).toBe("John");
  });

  it("includes publisher", () => {
    const data = buildEntryStructuredData(baseEntry, defaults);
    expect((data.publisher as any).name).toBe("My Site");
  });

  it("includes featured image when present", () => {
    const entry = {
      ...baseEntry,
      featuredImage: { id: "m1", url: "https://img.com/photo.jpg", alt: "Photo", width: 800, height: 600 },
    };
    const data = buildEntryStructuredData(entry, defaults);
    expect((data.image as any).url).toBe("https://img.com/photo.jpg");
  });

  it("excludes image when not present", () => {
    const data = buildEntryStructuredData(baseEntry, defaults);
    expect(data.image).toBeUndefined();
  });

  it("includes keywords from terms", () => {
    const entry = {
      ...baseEntry,
      terms: [
        { id: "t1", name: "JavaScript", slug: "js", taxonomy: { slug: "tag", name: "Tag" } },
        { id: "t2", name: "React", slug: "react", taxonomy: { slug: "tag", name: "Tag" } },
      ],
    };
    const data = buildEntryStructuredData(entry, defaults);
    expect(data.keywords).toBe("JavaScript, React");
  });

  it("returns WebPage type for non-posts", () => {
    const page = { ...baseEntry, contentType: { id: "ct2", slug: "page", nameSingular: "Page" } };
    const data = buildEntryStructuredData(page, defaults);
    expect(data["@type"]).toBe("WebPage");
    expect(data.name).toBe("My Post");
  });

  it("WebPage includes isPartOf", () => {
    const page = { ...baseEntry, contentType: { id: "ct2", slug: "page", nameSingular: "Page" } };
    const data = buildEntryStructuredData(page, defaults);
    expect((data.isPartOf as any)["@type"]).toBe("WebSite");
    expect((data.isPartOf as any).name).toBe("My Site");
  });
});

describe("buildSiteStructuredData", () => {
  it("returns WebSite type", () => {
    const data = buildSiteStructuredData(defaults);
    expect(data["@type"]).toBe("WebSite");
  });

  it("includes site name and description", () => {
    const data = buildSiteStructuredData(defaults);
    expect(data.name).toBe("My Site");
    expect(data.description).toBe("A test site");
  });

  it("includes SearchAction", () => {
    const data = buildSiteStructuredData(defaults);
    const action = data.potentialAction as any;
    expect(action["@type"]).toBe("SearchAction");
    expect(action.target).toContain("{search_term_string}");
  });
});

describe("buildBreadcrumbStructuredData", () => {
  it("returns BreadcrumbList type", () => {
    const data = buildBreadcrumbStructuredData([]);
    expect(data["@type"]).toBe("BreadcrumbList");
  });

  it("creates correct list elements with positions", () => {
    const items = [
      { name: "Home", url: "https://example.com" },
      { name: "Blog", url: "https://example.com/blog" },
    ];
    const data = buildBreadcrumbStructuredData(items);
    const elements = data.itemListElement as any[];
    expect(elements).toHaveLength(2);
    expect(elements[0].position).toBe(1);
    expect(elements[1].position).toBe(2);
    expect(elements[0].name).toBe("Home");
    expect(elements[1].item).toBe("https://example.com/blog");
  });

  it("handles empty items", () => {
    const data = buildBreadcrumbStructuredData([]);
    expect(data.itemListElement).toEqual([]);
  });
});
