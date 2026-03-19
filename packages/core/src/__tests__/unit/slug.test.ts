import { describe, it, expect } from "vitest";
import { slugify, uniqueSlug, SLUG_PATTERN } from "../../validation/slug";

describe("slugify()", () => {
  it("converts to lowercase", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugify("hello world")).toBe("hello-world");
  });

  it("strips special characters", () => {
    expect(slugify("Hello! @World #2025")).toBe("hello-world-2025");
  });

  it("handles accented characters", () => {
    expect(slugify("café résumé")).toBe("cafe-resume");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("hello---world")).toBe("hello-world");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("--hello--")).toBe("hello");
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });
});

describe("uniqueSlug()", () => {
  it("returns base slug when no collision", async () => {
    const slug = await uniqueSlug("hello-world", async () => false);
    expect(slug).toBe("hello-world");
  });

  it("appends -2 on first collision", async () => {
    const taken = new Set(["hello-world"]);
    const slug = await uniqueSlug("hello-world", async (c) => taken.has(c));
    expect(slug).toBe("hello-world-2");
  });

  it("appends -3 on second collision", async () => {
    const taken = new Set(["hello-world", "hello-world-2"]);
    const slug = await uniqueSlug("hello-world", async (c) => taken.has(c));
    expect(slug).toBe("hello-world-3");
  });

  it("generates 'untitled' for empty input", async () => {
    const slug = await uniqueSlug("", async () => false);
    expect(slug).toBe("untitled");
  });
});

describe("SLUG_PATTERN", () => {
  it("matches valid slugs", () => {
    expect(SLUG_PATTERN.test("hello-world")).toBe(true);
    expect(SLUG_PATTERN.test("post-123")).toBe(true);
    expect(SLUG_PATTERN.test("a")).toBe(true);
  });

  it("rejects invalid slugs", () => {
    expect(SLUG_PATTERN.test("Hello-World")).toBe(false);
    expect(SLUG_PATTERN.test("hello_world")).toBe(false);
    expect(SLUG_PATTERN.test("-hello")).toBe(false);
    expect(SLUG_PATTERN.test("hello-")).toBe(false);
    expect(SLUG_PATTERN.test("")).toBe(false);
  });
});
