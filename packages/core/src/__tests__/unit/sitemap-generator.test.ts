import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma, resetMockPrisma } from "../mocks/prisma";

vi.mock("@nextpress/db", () => ({ prisma: mockPrisma }));

const { sitemapGenerator } = await import("../../seo/sitemap-generator");

beforeEach(() => {
  resetMockPrisma();
});

describe("sitemapGenerator.generate", () => {
  it("generates single sitemap when <= 1000 entries", async () => {
    mockPrisma.contentEntry.count.mockResolvedValue(10);
    mockPrisma.contentEntry.findMany.mockResolvedValue([
      { slug: "hello", updatedAt: new Date("2025-01-01"), contentType: { slug: "post" } },
    ]);
    mockPrisma.term.findMany.mockResolvedValue([]);

    const xml = await sitemapGenerator.generate("site-1", "https://example.com");
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain("<urlset");
    expect(xml).toContain("https://example.com");
  });

  it("generates sitemap index when > 1000 entries", async () => {
    mockPrisma.contentEntry.count.mockResolvedValue(2500);

    const xml = await sitemapGenerator.generate("site-1", "https://example.com");
    expect(xml).toContain("<sitemapindex");
    expect(xml).toContain("sitemap-1.xml");
    expect(xml).toContain("sitemap-2.xml");
    expect(xml).toContain("sitemap-3.xml");
  });
});

describe("sitemapGenerator.generateSingleSitemap", () => {
  it("includes homepage", async () => {
    mockPrisma.contentEntry.findMany.mockResolvedValue([]);
    mockPrisma.term.findMany.mockResolvedValue([]);

    const xml = await sitemapGenerator.generateSingleSitemap("site-1", "https://example.com", 0);
    expect(xml).toContain("<loc>https://example.com</loc>");
    expect(xml).toContain("<priority>1</priority>");
  });

  it("generates correct URLs for posts", async () => {
    mockPrisma.contentEntry.findMany.mockResolvedValue([
      { slug: "my-post", updatedAt: new Date("2025-03-01"), contentType: { slug: "post" } },
    ]);
    mockPrisma.term.findMany.mockResolvedValue([]);

    const xml = await sitemapGenerator.generateSingleSitemap("s1", "https://example.com", 0);
    expect(xml).toContain("<loc>https://example.com/post/my-post</loc>");
    expect(xml).toContain("<priority>0.6</priority>");
  });

  it("generates correct URLs for pages (no content type prefix)", async () => {
    mockPrisma.contentEntry.findMany.mockResolvedValue([
      { slug: "about", updatedAt: new Date("2025-03-01"), contentType: { slug: "page" } },
    ]);
    mockPrisma.term.findMany.mockResolvedValue([]);

    const xml = await sitemapGenerator.generateSingleSitemap("s1", "https://example.com", 0);
    expect(xml).toContain("<loc>https://example.com/about</loc>");
    expect(xml).toContain("<priority>0.8</priority>");
  });

  it("includes taxonomy terms", async () => {
    mockPrisma.contentEntry.findMany.mockResolvedValue([]);
    mockPrisma.term.findMany.mockResolvedValue([
      { slug: "javascript", taxonomy: { slug: "tag" } },
    ]);

    const xml = await sitemapGenerator.generateSingleSitemap("s1", "https://example.com", 0);
    expect(xml).toContain("<loc>https://example.com/tag/javascript</loc>");
  });

  it("escapes XML special characters", async () => {
    mockPrisma.contentEntry.findMany.mockResolvedValue([]);
    mockPrisma.term.findMany.mockResolvedValue([]);

    const xml = await sitemapGenerator.generateSingleSitemap("s1", "https://example.com/?a=1&b=2", 0);
    expect(xml).toContain("&amp;");
  });
});
