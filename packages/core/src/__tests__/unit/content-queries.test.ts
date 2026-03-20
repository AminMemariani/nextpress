import { describe, it, expect } from "vitest";
import {
  buildContentWhere,
  buildContentOrderBy,
  CONTENT_LIST_SELECT,
  CONTENT_FULL_SELECT,
} from "../../content/content-queries";
import type { ListContentEntriesInput } from "../../content/content-types";

const baseInput: ListContentEntriesInput = {
  contentTypeSlug: "post",
  page: 1,
  perPage: 20,
  sortBy: "createdAt",
  sortOrder: "desc",
};

describe("buildContentWhere", () => {
  it("includes siteId and contentTypeId", () => {
    const where = buildContentWhere("site-1", "ct-1", baseInput);
    expect(where.siteId).toBe("site-1");
    expect(where.contentTypeId).toBe("ct-1");
  });

  it("adds status filter when provided", () => {
    const where = buildContentWhere("s", "ct", { ...baseInput, status: "PUBLISHED" });
    expect(where.status).toBe("PUBLISHED");
  });

  it("omits status when not provided", () => {
    const where = buildContentWhere("s", "ct", baseInput);
    expect(where.status).toBeUndefined();
  });

  it("adds authorId filter", () => {
    const where = buildContentWhere("s", "ct", { ...baseInput, authorId: "u-1" });
    expect(where.authorId).toBe("u-1");
  });

  it("adds search with OR clause", () => {
    const where = buildContentWhere("s", "ct", { ...baseInput, search: "hello" });
    expect(where.OR).toBeDefined();
    expect(where.OR).toHaveLength(2);
    expect((where.OR as any[])[0]).toHaveProperty("title");
    expect((where.OR as any[])[1]).toHaveProperty("excerpt");
  });

  it("adds term filter", () => {
    const where = buildContentWhere("s", "ct", { ...baseInput, termIds: ["t1", "t2"] });
    expect(where.terms).toEqual({
      some: { termId: { in: ["t1", "t2"] } },
    });
  });

  it("omits term filter for empty array", () => {
    const where = buildContentWhere("s", "ct", { ...baseInput, termIds: [] });
    expect(where.terms).toBeUndefined();
  });

  it("adds date range filter with from", () => {
    const from = new Date("2025-01-01");
    const where = buildContentWhere("s", "ct", {
      ...baseInput,
      dateRange: { from },
    });
    expect((where.createdAt as any).gte).toEqual(from);
  });

  it("adds date range filter with to", () => {
    const to = new Date("2025-12-31");
    const where = buildContentWhere("s", "ct", {
      ...baseInput,
      dateRange: { to },
    });
    expect((where.createdAt as any).lte).toEqual(to);
  });

  it("adds date range filter with from and to", () => {
    const from = new Date("2025-01-01");
    const to = new Date("2025-12-31");
    const where = buildContentWhere("s", "ct", {
      ...baseInput,
      dateRange: { from, to },
    });
    expect((where.createdAt as any).gte).toEqual(from);
    expect((where.createdAt as any).lte).toEqual(to);
  });

  it("ignores empty date range", () => {
    const where = buildContentWhere("s", "ct", {
      ...baseInput,
      dateRange: {},
    });
    expect(where.createdAt).toBeUndefined();
  });

  it("combines all filters", () => {
    const where = buildContentWhere("s", "ct", {
      ...baseInput,
      status: "DRAFT",
      authorId: "u-1",
      search: "test",
      termIds: ["t1"],
      dateRange: { from: new Date() },
    });
    expect(where.status).toBe("DRAFT");
    expect(where.authorId).toBe("u-1");
    expect(where.OR).toBeDefined();
    expect(where.terms).toBeDefined();
    expect(where.createdAt).toBeDefined();
  });
});

describe("buildContentOrderBy", () => {
  it("returns createdAt desc by default", () => {
    expect(buildContentOrderBy(baseInput)).toEqual({ createdAt: "desc" });
  });

  it("returns publishedAt", () => {
    expect(buildContentOrderBy({ ...baseInput, sortBy: "publishedAt" })).toEqual({
      publishedAt: "desc",
    });
  });

  it("returns updatedAt", () => {
    expect(buildContentOrderBy({ ...baseInput, sortBy: "updatedAt" })).toEqual({
      updatedAt: "desc",
    });
  });

  it("returns title", () => {
    expect(buildContentOrderBy({ ...baseInput, sortBy: "title", sortOrder: "asc" })).toEqual({
      title: "asc",
    });
  });

  it("returns menuOrder", () => {
    expect(buildContentOrderBy({ ...baseInput, sortBy: "menuOrder" })).toEqual({
      menuOrder: "desc",
    });
  });
});

describe("CONTENT_LIST_SELECT", () => {
  it("includes essential fields", () => {
    expect(CONTENT_LIST_SELECT.id).toBe(true);
    expect(CONTENT_LIST_SELECT.title).toBe(true);
    expect(CONTENT_LIST_SELECT.slug).toBe(true);
    expect(CONTENT_LIST_SELECT.status).toBe(true);
  });

  it("includes author select", () => {
    expect(CONTENT_LIST_SELECT.author.select).toBeDefined();
    expect(CONTENT_LIST_SELECT.author.select.id).toBe(true);
  });

  it("includes comment count", () => {
    expect(CONTENT_LIST_SELECT._count.select.comments).toBe(true);
  });
});

describe("CONTENT_FULL_SELECT", () => {
  it("includes blocks", () => {
    expect(CONTENT_FULL_SELECT.blocks).toBe(true);
  });

  it("includes fieldValues", () => {
    expect(CONTENT_FULL_SELECT.fieldValues).toBeDefined();
  });

  it("includes terms with taxonomy", () => {
    expect(CONTENT_FULL_SELECT.terms).toBeDefined();
  });

  it("includes mediaAttachments for featured image", () => {
    expect(CONTENT_FULL_SELECT.mediaAttachments).toBeDefined();
    expect((CONTENT_FULL_SELECT.mediaAttachments as any).where.role).toBe("featured_image");
  });

  it("includes revision count", () => {
    expect(CONTENT_FULL_SELECT._count.select.revisions).toBe(true);
  });
});
