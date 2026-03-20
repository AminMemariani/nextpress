import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma, resetMockPrisma } from "../mocks/prisma";

vi.mock("@nextpress/db", () => ({ prisma: mockPrisma }));

const { searchService, setSearchProvider } = await import("../../search/search-service");

beforeEach(() => {
  resetMockPrisma();
  setSearchProvider(null as any);
});

describe("searchService.extractTextFromBlocks", () => {
  it("extracts content attribute", () => {
    const blocks = [
      { id: "1", type: "paragraph", attributes: { content: "<p>Hello <strong>world</strong></p>" }, innerBlocks: [] },
    ];
    const text = searchService.extractTextFromBlocks(blocks);
    expect(text).toContain("Hello");
    expect(text).toContain("world");
    expect(text).not.toContain("<p>");
  });

  it("extracts text attribute", () => {
    const blocks = [
      { id: "1", type: "heading", attributes: { text: "My Title" }, innerBlocks: [] },
    ];
    expect(searchService.extractTextFromBlocks(blocks)).toBe("My Title");
  });

  it("extracts caption", () => {
    const blocks = [
      { id: "1", type: "image", attributes: { caption: "Photo caption" }, innerBlocks: [] },
    ];
    expect(searchService.extractTextFromBlocks(blocks)).toBe("Photo caption");
  });

  it("extracts citation", () => {
    const blocks = [
      { id: "1", type: "quote", attributes: { citation: "Famous Person" }, innerBlocks: [] },
    ];
    expect(searchService.extractTextFromBlocks(blocks)).toBe("Famous Person");
  });

  it("recurses into inner blocks", () => {
    const blocks = [
      {
        id: "1", type: "columns", attributes: {},
        innerBlocks: [
          { id: "2", type: "paragraph", attributes: { text: "Column text" }, innerBlocks: [] },
        ],
      },
    ];
    expect(searchService.extractTextFromBlocks(blocks)).toContain("Column text");
  });

  it("handles empty blocks", () => {
    expect(searchService.extractTextFromBlocks([])).toBe("");
  });

  it("collapses whitespace", () => {
    const blocks = [
      { id: "1", type: "p", attributes: { text: "a" }, innerBlocks: [] },
      { id: "2", type: "p", attributes: { text: "b" }, innerBlocks: [] },
    ];
    expect(searchService.extractTextFromBlocks(blocks)).toBe("a b");
  });
});

describe("searchService.search with external provider", () => {
  it("delegates to external provider", async () => {
    const mockProvider = {
      search: vi.fn().mockResolvedValue({ results: [], total: 0, page: 1, perPage: 20, totalPages: 0, query: "test", durationMs: 5 }),
      index: vi.fn(),
      remove: vi.fn(),
      reindexAll: vi.fn(),
    };
    setSearchProvider(mockProvider);

    await searchService.search("site-1", { query: "test" });
    expect(mockProvider.search).toHaveBeenCalledWith("site-1", expect.objectContaining({ query: "test" }));
  });
});

describe("searchService.index", () => {
  it("delegates to external provider when set", async () => {
    const mockProvider = { search: vi.fn(), index: vi.fn(), remove: vi.fn(), reindexAll: vi.fn() };
    setSearchProvider(mockProvider);

    await searchService.index("site-1", {} as any);
    expect(mockProvider.index).toHaveBeenCalled();
  });

  it("no-ops for postgres mode", async () => {
    await expect(searchService.index("site-1", {} as any)).resolves.toBeUndefined();
  });
});

describe("searchService.remove", () => {
  it("delegates to external provider when set", async () => {
    const mockProvider = { search: vi.fn(), index: vi.fn(), remove: vi.fn(), reindexAll: vi.fn() };
    setSearchProvider(mockProvider);

    await searchService.remove("site-1", "entry-1");
    expect(mockProvider.remove).toHaveBeenCalledWith("site-1", "entry-1");
  });
});

describe("searchService.buildIndexableEntry", () => {
  it("returns null for missing entry", async () => {
    mockPrisma.contentEntry.findUnique.mockResolvedValue(null);
    const result = await searchService.buildIndexableEntry("bad");
    expect(result).toBeNull();
  });

  it("builds indexable entry", async () => {
    mockPrisma.contentEntry.findUnique.mockResolvedValue({
      id: "e1", title: "Test", slug: "test", excerpt: "Summary",
      blocks: [{ id: "b1", type: "p", attributes: { text: "Body" }, innerBlocks: [] }],
      status: "PUBLISHED", publishedAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
      contentType: { slug: "post" },
      author: { name: "John", displayName: "John Doe" },
      terms: [{ term: { name: "JS" } }],
    });

    const result = await searchService.buildIndexableEntry("e1");
    expect(result).not.toBeNull();
    expect(result!.title).toBe("Test");
    expect(result!.bodyText).toBe("Body");
    expect(result!.authorName).toBe("John Doe");
    expect(result!.termNames).toEqual(["JS"]);
  });
});
