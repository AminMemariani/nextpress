import { describe, it, expect } from "vitest";
import { resolveTemplate, buildHierarchy } from "../../theme/template-resolver";

function makeTemplates(names: string[]) {
  const map = new Map<string, any>();
  for (const name of names) {
    map.set(name, () => null); // dummy component
  }
  return map;
}

describe("buildHierarchy()", () => {
  it("builds single post hierarchy", () => {
    const h = buildHierarchy({
      pageType: "single",
      contentTypeSlug: "post",
      entrySlug: "hello-world",
    });
    expect(h).toEqual([
      "single-post-hello-world",
      "single-post",
      "single",
      "index",
    ]);
  });

  it("puts per-entry template first", () => {
    const h = buildHierarchy({
      pageType: "single",
      contentTypeSlug: "post",
      entrySlug: "hello",
      entryTemplate: "full-width",
    });
    expect(h[0]).toBe("full-width");
  });

  it("builds page hierarchy with page template", () => {
    const h = buildHierarchy({
      pageType: "single",
      contentTypeSlug: "page",
      entrySlug: "about",
      isHierarchical: true,
    });
    expect(h).toContain("page-about");
    expect(h).toContain("page");
  });

  it("builds taxonomy hierarchy", () => {
    const h = buildHierarchy({
      pageType: "taxonomy",
      taxonomySlug: "category",
      termSlug: "tech",
    });
    expect(h[0]).toBe("taxonomy-category-tech");
    expect(h).toContain("taxonomy-category");
    expect(h).toContain("taxonomy");
    expect(h).toContain("archive");
    expect(h[h.length - 1]).toBe("index");
  });

  it("builds home hierarchy", () => {
    const h = buildHierarchy({ pageType: "home" });
    expect(h).toEqual(["front-page", "home", "index"]);
  });

  it("builds 404 hierarchy", () => {
    const h = buildHierarchy({ pageType: "404" });
    expect(h).toEqual(["404", "index"]);
  });
});

describe("resolveTemplate()", () => {
  it("picks the most specific match", () => {
    const templates = makeTemplates(["single-post", "single", "index"]);
    const { resolvedSlug } = resolveTemplate(templates, {
      pageType: "single",
      contentTypeSlug: "post",
      entrySlug: "hello",
    });
    expect(resolvedSlug).toBe("single-post");
  });

  it("falls back to index", () => {
    const templates = makeTemplates(["index"]);
    const { resolvedSlug } = resolveTemplate(templates, {
      pageType: "single",
      contentTypeSlug: "post",
      entrySlug: "hello",
    });
    expect(resolvedSlug).toBe("index");
  });

  it("throws if no index template", () => {
    const templates = makeTemplates([]);
    expect(() =>
      resolveTemplate(templates, { pageType: "home" }),
    ).toThrow("index");
  });
});
