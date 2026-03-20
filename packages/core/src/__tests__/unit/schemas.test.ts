import { describe, it, expect } from "vitest";
import {
  slugSchema,
  paginationSchema,
  paginate,
  contentStatusSchema,
  blockDataSchema,
  dateRangeSchema,
  sortOrderSchema,
  cuidSchema,
} from "../../validation/schemas";

describe("cuidSchema", () => {
  it("accepts valid CUIDs", () => {
    expect(() => cuidSchema.parse("clh1234567890abcdef")).not.toThrow();
  });

  it("rejects non-CUID strings", () => {
    expect(() => cuidSchema.parse("not-a-cuid")).toThrow();
  });
});

describe("slugSchema", () => {
  it("accepts valid slugs", () => {
    expect(slugSchema.parse("hello-world")).toBe("hello-world");
    expect(slugSchema.parse("a")).toBe("a");
    expect(slugSchema.parse("post-123")).toBe("post-123");
  });

  it("rejects empty string", () => {
    expect(() => slugSchema.parse("")).toThrow();
  });

  it("rejects uppercase", () => {
    expect(() => slugSchema.parse("Hello")).toThrow();
  });

  it("rejects underscores", () => {
    expect(() => slugSchema.parse("hello_world")).toThrow();
  });

  it("rejects leading hyphens", () => {
    expect(() => slugSchema.parse("-hello")).toThrow();
  });

  it("rejects trailing hyphens", () => {
    expect(() => slugSchema.parse("hello-")).toThrow();
  });

  it("rejects strings over max length", () => {
    const long = "a".repeat(201);
    expect(() => slugSchema.parse(long)).toThrow();
  });
});

describe("paginationSchema", () => {
  it("applies defaults for page and perPage", () => {
    const result = paginationSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(20);
  });

  it("accepts valid values", () => {
    const result = paginationSchema.parse({ page: 3, perPage: 50 });
    expect(result.page).toBe(3);
    expect(result.perPage).toBe(50);
  });

  it("rejects page < 1", () => {
    expect(() => paginationSchema.parse({ page: 0 })).toThrow();
  });

  it("rejects perPage > 100", () => {
    expect(() => paginationSchema.parse({ perPage: 101 })).toThrow();
  });

  it("rejects perPage < 1", () => {
    expect(() => paginationSchema.parse({ perPage: 0 })).toThrow();
  });

  it("rejects non-integer page", () => {
    expect(() => paginationSchema.parse({ page: 1.5 })).toThrow();
  });
});

describe("paginate()", () => {
  it("computes totalPages correctly", () => {
    const result = paginate(["a", "b"], 25, { page: 1, perPage: 10 });
    expect(result).toEqual({
      items: ["a", "b"],
      total: 25,
      page: 1,
      perPage: 10,
      totalPages: 3,
    });
  });

  it("handles zero total", () => {
    const result = paginate([], 0, { page: 1, perPage: 20 });
    expect(result.totalPages).toBe(0);
    expect(result.items).toEqual([]);
  });

  it("handles exact division", () => {
    const result = paginate([], 100, { page: 5, perPage: 20 });
    expect(result.totalPages).toBe(5);
  });

  it("rounds up partial pages", () => {
    const result = paginate([], 21, { page: 1, perPage: 20 });
    expect(result.totalPages).toBe(2);
  });
});

describe("contentStatusSchema", () => {
  const validStatuses = ["DRAFT", "PENDING_REVIEW", "PUBLISHED", "SCHEDULED", "PRIVATE", "ARCHIVED", "TRASH"];

  it.each(validStatuses)("accepts %s", (status) => {
    expect(contentStatusSchema.parse(status)).toBe(status);
  });

  it("rejects invalid status", () => {
    expect(() => contentStatusSchema.parse("UNKNOWN")).toThrow();
  });
});

describe("sortOrderSchema", () => {
  it("defaults to desc", () => {
    expect(sortOrderSchema.parse(undefined)).toBe("desc");
  });

  it("accepts asc", () => {
    expect(sortOrderSchema.parse("asc")).toBe("asc");
  });

  it("rejects invalid", () => {
    expect(() => sortOrderSchema.parse("up")).toThrow();
  });
});

describe("dateRangeSchema", () => {
  it("accepts empty object", () => {
    expect(dateRangeSchema.parse({})).toEqual({});
  });

  it("coerces date strings", () => {
    const result = dateRangeSchema.parse({
      from: "2025-01-01",
      to: "2025-12-31",
    });
    expect(result.from).toBeInstanceOf(Date);
    expect(result.to).toBeInstanceOf(Date);
  });
});

describe("blockDataSchema", () => {
  it("accepts valid block", () => {
    const block = {
      id: "b1",
      type: "paragraph",
      attributes: { text: "hello" },
      innerBlocks: [],
    };
    expect(() => blockDataSchema.parse(block)).not.toThrow();
  });

  it("defaults innerBlocks to empty array", () => {
    const result = blockDataSchema.parse({
      id: "b1",
      type: "heading",
      attributes: {},
    });
    expect(result.innerBlocks).toEqual([]);
  });

  it("accepts nested blocks", () => {
    const block = {
      id: "b1",
      type: "columns",
      attributes: {},
      innerBlocks: [
        { id: "b2", type: "paragraph", attributes: { text: "col1" } },
      ],
    };
    expect(() => blockDataSchema.parse(block)).not.toThrow();
  });

  it("rejects missing type", () => {
    expect(() => blockDataSchema.parse({ id: "b1", attributes: {} })).toThrow();
  });

  it("rejects missing id", () => {
    expect(() => blockDataSchema.parse({ type: "p", attributes: {} })).toThrow();
  });
});
