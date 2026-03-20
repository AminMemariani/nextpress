import { describe, it, expect } from "vitest";
import {
  createContentEntrySchema,
  updateContentEntrySchema,
  listContentEntriesSchema,
  STATUS_TRANSITIONS,
} from "../../content/content-types";

describe("createContentEntrySchema", () => {
  const validInput = {
    contentTypeSlug: "post",
    title: "My Post",
  };

  it("accepts minimal valid input", () => {
    const result = createContentEntrySchema.parse(validInput);
    expect(result.contentTypeSlug).toBe("post");
    expect(result.title).toBe("My Post");
  });

  it("applies defaults", () => {
    const result = createContentEntrySchema.parse(validInput);
    expect(result.status).toBe("DRAFT");
    expect(result.blocks).toEqual([]);
    expect(result.menuOrder).toBe(0);
    expect(result.fields).toEqual({});
    expect(result.termIds).toEqual([]);
  });

  it("rejects empty title", () => {
    expect(() =>
      createContentEntrySchema.parse({ ...validInput, title: "" }),
    ).toThrow();
  });

  it("rejects title over 500 chars", () => {
    expect(() =>
      createContentEntrySchema.parse({ ...validInput, title: "x".repeat(501) }),
    ).toThrow();
  });

  it("rejects empty contentTypeSlug", () => {
    expect(() =>
      createContentEntrySchema.parse({ ...validInput, contentTypeSlug: "" }),
    ).toThrow();
  });

  it("accepts valid status values", () => {
    const result = createContentEntrySchema.parse({
      ...validInput,
      status: "PUBLISHED",
    });
    expect(result.status).toBe("PUBLISHED");
  });

  it("rejects invalid status", () => {
    expect(() =>
      createContentEntrySchema.parse({ ...validInput, status: "INVALID" }),
    ).toThrow();
  });

  it("accepts optional slug", () => {
    const result = createContentEntrySchema.parse({
      ...validInput,
      slug: "my-post",
    });
    expect(result.slug).toBe("my-post");
  });

  it("accepts blocks array", () => {
    const result = createContentEntrySchema.parse({
      ...validInput,
      blocks: [{ id: "b1", type: "paragraph", attributes: { text: "hi" } }],
    });
    expect(result.blocks).toHaveLength(1);
  });

  it("coerces scheduledAt to Date", () => {
    const result = createContentEntrySchema.parse({
      ...validInput,
      scheduledAt: "2025-12-01T00:00:00Z",
    });
    expect(result.scheduledAt).toBeInstanceOf(Date);
  });

  it("accepts excerpt up to 2000 chars", () => {
    const result = createContentEntrySchema.parse({
      ...validInput,
      excerpt: "x".repeat(2000),
    });
    expect(result.excerpt).toHaveLength(2000);
  });

  it("rejects excerpt over 2000 chars", () => {
    expect(() =>
      createContentEntrySchema.parse({ ...validInput, excerpt: "x".repeat(2001) }),
    ).toThrow();
  });
});

describe("updateContentEntrySchema", () => {
  it("accepts empty object (all optional)", () => {
    const result = updateContentEntrySchema.parse({});
    expect(result).toEqual({});
  });

  it("accepts partial title update", () => {
    const result = updateContentEntrySchema.parse({ title: "New Title" });
    expect(result.title).toBe("New Title");
  });

  it("accepts status update", () => {
    const result = updateContentEntrySchema.parse({ status: "PUBLISHED" });
    expect(result.status).toBe("PUBLISHED");
  });

  it("rejects invalid status", () => {
    expect(() => updateContentEntrySchema.parse({ status: "BAD" })).toThrow();
  });

  it("accepts nullable fields", () => {
    const result = updateContentEntrySchema.parse({
      excerpt: null,
      password: null,
      parentId: null,
    });
    expect(result.excerpt).toBeNull();
    expect(result.password).toBeNull();
    expect(result.parentId).toBeNull();
  });
});

describe("listContentEntriesSchema", () => {
  const minInput = { contentTypeSlug: "post" };

  it("applies pagination defaults", () => {
    const result = listContentEntriesSchema.parse(minInput);
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(20);
  });

  it("defaults sortBy to createdAt", () => {
    const result = listContentEntriesSchema.parse(minInput);
    expect(result.sortBy).toBe("createdAt");
  });

  it("defaults sortOrder to desc", () => {
    const result = listContentEntriesSchema.parse(minInput);
    expect(result.sortOrder).toBe("desc");
  });

  it("accepts all sortBy values", () => {
    for (const sortBy of ["publishedAt", "createdAt", "updatedAt", "title", "menuOrder"]) {
      expect(() =>
        listContentEntriesSchema.parse({ ...minInput, sortBy }),
      ).not.toThrow();
    }
  });

  it("rejects invalid sortBy", () => {
    expect(() =>
      listContentEntriesSchema.parse({ ...minInput, sortBy: "bad" }),
    ).toThrow();
  });

  it("accepts optional filters", () => {
    const result = listContentEntriesSchema.parse({
      ...minInput,
      status: "PUBLISHED",
      search: "hello",
    });
    expect(result.status).toBe("PUBLISHED");
    expect(result.search).toBe("hello");
  });
});

describe("STATUS_TRANSITIONS", () => {
  it("DRAFT can transition to 5 statuses", () => {
    expect(STATUS_TRANSITIONS.DRAFT).toHaveLength(5);
  });

  it("TRASH can only go to DRAFT", () => {
    expect(STATUS_TRANSITIONS.TRASH).toEqual(["DRAFT"]);
  });

  it("PUBLISHED cannot go to PENDING_REVIEW", () => {
    expect(STATUS_TRANSITIONS.PUBLISHED).not.toContain("PENDING_REVIEW");
  });

  it("all statuses have transition rules", () => {
    const statuses = ["DRAFT", "PENDING_REVIEW", "PUBLISHED", "SCHEDULED", "PRIVATE", "ARCHIVED", "TRASH"];
    for (const status of statuses) {
      expect(STATUS_TRANSITIONS[status as keyof typeof STATUS_TRANSITIONS]).toBeDefined();
    }
  });
});
