import { describe, it, expect } from "vitest";
import {
  fieldTypeSchema,
  selectOptionSchema,
  fieldValidationSchema,
  createFieldDefinitionSchema,
  updateFieldDefinitionSchema,
} from "../../fields/field-types";
import {
  BUILT_IN_SETTING_GROUPS,
  getSettingsSchema,
  updateSettingsSchema,
  DEFAULT_SETTINGS,
} from "../../settings/settings-types";
import {
  commentStatusSchema,
  submitCommentSchema,
  listCommentsSchema,
  moderateCommentSchema,
} from "../../comment/comment-types";
import {
  menuItemTypeSchema,
  menuItemInputSchema,
  saveMenuSchema,
} from "../../menu/menu-types";
import {
  createContentTypeSchema,
  updateContentTypeSchema,
} from "../../content-type/content-type-types";
import {
  WEBHOOK_EVENTS,
  webhookConfigSchema,
} from "../../webhooks/webhook-types";
import {
  createTaxonomySchema,
  createTermSchema,
  updateTermSchema,
} from "../../taxonomy/taxonomy-types";
import { searchInputSchema } from "../../search/search-types";
import { pluginManifestSchema } from "../../plugin/plugin-types";
import { themeManifestSchema } from "../../theme/theme-types";
import { createRevisionSchema } from "../../revision/revision-types";

// ── Field Types ──

describe("fieldTypeSchema", () => {
  const validTypes = [
    "TEXT", "TEXTAREA", "RICHTEXT", "NUMBER", "BOOLEAN", "DATE", "DATETIME",
    "SELECT", "MULTISELECT", "MEDIA", "RELATION", "COLOR", "URL", "EMAIL", "JSON",
  ];

  it.each(validTypes)("accepts %s", (type) => {
    expect(fieldTypeSchema.parse(type)).toBe(type);
  });

  it("rejects invalid type", () => {
    expect(() => fieldTypeSchema.parse("INVALID")).toThrow();
  });
});

describe("selectOptionSchema", () => {
  it("accepts valid option", () => {
    expect(selectOptionSchema.parse({ label: "Red", value: "red" })).toEqual({ label: "Red", value: "red" });
  });

  it("rejects empty label", () => {
    expect(() => selectOptionSchema.parse({ label: "", value: "x" })).toThrow();
  });

  it("rejects empty value", () => {
    expect(() => selectOptionSchema.parse({ label: "X", value: "" })).toThrow();
  });
});

describe("fieldValidationSchema", () => {
  it("accepts undefined (optional)", () => {
    expect(fieldValidationSchema.parse(undefined)).toBeUndefined();
  });

  it("accepts partial validation rules", () => {
    const result = fieldValidationSchema.parse({ min: 0, max: 100 });
    expect(result).toEqual({ min: 0, max: 100 });
  });

  it("accepts precision in range", () => {
    expect(() => fieldValidationSchema.parse({ precision: 5 })).not.toThrow();
  });

  it("rejects precision > 10", () => {
    expect(() => fieldValidationSchema.parse({ precision: 11 })).toThrow();
  });
});

describe("createFieldDefinitionSchema", () => {
  const validField = {
    key: "subtitle",
    name: "Subtitle",
    fieldType: "TEXT",
  };

  it("accepts valid field", () => {
    const result = createFieldDefinitionSchema.parse(validField);
    expect(result.key).toBe("subtitle");
    expect(result.isRequired).toBe(false);
    expect(result.group).toBe("custom-fields");
    expect(result.sortOrder).toBe(0);
  });

  it("rejects key starting with number", () => {
    expect(() =>
      createFieldDefinitionSchema.parse({ ...validField, key: "1bad" }),
    ).toThrow();
  });

  it("rejects key with uppercase", () => {
    expect(() =>
      createFieldDefinitionSchema.parse({ ...validField, key: "Bad" }),
    ).toThrow();
  });

  it("accepts key with underscores", () => {
    expect(() =>
      createFieldDefinitionSchema.parse({ ...validField, key: "my_field" }),
    ).not.toThrow();
  });
});

describe("updateFieldDefinitionSchema", () => {
  it("accepts partial update", () => {
    const result = updateFieldDefinitionSchema.parse({ name: "New Name" });
    expect(result.name).toBe("New Name");
  });

  it("omits key and contentTypeId", () => {
    const result = updateFieldDefinitionSchema.parse({ name: "X" });
    expect(result).not.toHaveProperty("key");
    expect(result).not.toHaveProperty("contentTypeId");
  });
});

// ── Settings Types ──

describe("BUILT_IN_SETTING_GROUPS", () => {
  it("has 6 groups", () => {
    expect(BUILT_IN_SETTING_GROUPS).toHaveLength(6);
  });

  it("includes general and reading", () => {
    const slugs = BUILT_IN_SETTING_GROUPS.map((g) => g.slug);
    expect(slugs).toContain("general");
    expect(slugs).toContain("reading");
  });
});

describe("getSettingsSchema", () => {
  it("requires group", () => {
    expect(() => getSettingsSchema.parse({})).toThrow();
  });

  it("accepts valid group", () => {
    expect(getSettingsSchema.parse({ group: "general" })).toEqual({ group: "general" });
  });
});

describe("updateSettingsSchema", () => {
  it("requires group and values", () => {
    expect(() => updateSettingsSchema.parse({})).toThrow();
  });

  it("accepts valid input", () => {
    const result = updateSettingsSchema.parse({ group: "general", values: { key: "val" } });
    expect(result.group).toBe("general");
    expect(result.values).toEqual({ key: "val" });
  });
});

describe("DEFAULT_SETTINGS", () => {
  it("has general group with timezone UTC", () => {
    expect(DEFAULT_SETTINGS.general.timezone).toBe("UTC");
  });

  it("has reading group with posts_per_page 10", () => {
    expect(DEFAULT_SETTINGS.reading.posts_per_page).toBe(10);
  });

  it("has discussion group with comments_enabled true", () => {
    expect(DEFAULT_SETTINGS.discussion.comments_enabled).toBe(true);
  });
});

// ── Comment Types ──

describe("commentStatusSchema", () => {
  it.each(["PENDING", "APPROVED", "SPAM", "TRASH"])("accepts %s", (s) => {
    expect(commentStatusSchema.parse(s)).toBe(s);
  });

  it("rejects invalid", () => {
    expect(() => commentStatusSchema.parse("BAD")).toThrow();
  });
});

describe("submitCommentSchema", () => {
  it("accepts valid comment", () => {
    const result = submitCommentSchema.parse({
      contentEntryId: "clh1234567890abcdef",
      body: "Great post!",
    });
    expect(result.body).toBe("Great post!");
  });

  it("rejects empty body", () => {
    expect(() =>
      submitCommentSchema.parse({ contentEntryId: "clh1234567890abcdef", body: "" }),
    ).toThrow();
  });

  it("rejects body over 10000 chars", () => {
    expect(() =>
      submitCommentSchema.parse({
        contentEntryId: "clh1234567890abcdef",
        body: "x".repeat(10001),
      }),
    ).toThrow();
  });
});

describe("listCommentsSchema", () => {
  it("applies defaults", () => {
    const result = listCommentsSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.sortBy).toBe("createdAt");
  });
});

describe("moderateCommentSchema", () => {
  it("accepts valid status", () => {
    expect(moderateCommentSchema.parse({ status: "APPROVED" })).toEqual({ status: "APPROVED" });
  });

  it("rejects invalid status", () => {
    expect(() => moderateCommentSchema.parse({ status: "INVALID" })).toThrow();
  });
});

// ── Menu Types ──

describe("menuItemTypeSchema", () => {
  it.each(["custom", "content", "taxonomy"])("accepts %s", (t) => {
    expect(menuItemTypeSchema.parse(t)).toBe(t);
  });
});

describe("saveMenuSchema", () => {
  it("accepts valid menu", () => {
    const result = saveMenuSchema.parse({
      location: "primary",
      name: "Main Menu",
      items: [{ label: "Home", type: "custom", url: "/" }],
    });
    expect(result.items).toHaveLength(1);
  });

  it("rejects empty location", () => {
    expect(() =>
      saveMenuSchema.parse({ location: "", name: "X", items: [] }),
    ).toThrow();
  });
});

// ── ContentType Types ──

describe("createContentTypeSchema", () => {
  const valid = { slug: "product", nameSingular: "Product", namePlural: "Products" };

  it("accepts valid input with defaults", () => {
    const result = createContentTypeSchema.parse(valid);
    expect(result.hierarchical).toBe(false);
    expect(result.hasArchive).toBe(true);
    expect(result.isPublic).toBe(true);
    expect(result.menuIcon).toBe("file-text");
    expect(result.supports).toContain("title");
  });

  it("rejects invalid slug", () => {
    expect(() =>
      createContentTypeSchema.parse({ ...valid, slug: "Bad Slug" }),
    ).toThrow();
  });
});

describe("updateContentTypeSchema", () => {
  it("accepts partial update (no slug)", () => {
    const result = updateContentTypeSchema.parse({ nameSingular: "Item" });
    expect(result.nameSingular).toBe("Item");
    expect(result).not.toHaveProperty("slug");
  });
});

// ── Webhook Types ──

describe("WEBHOOK_EVENTS", () => {
  it("has 9 events", () => {
    expect(WEBHOOK_EVENTS).toHaveLength(9);
  });

  it("includes content.created", () => {
    expect(WEBHOOK_EVENTS).toContain("content.created");
  });
});

describe("webhookConfigSchema", () => {
  const valid = {
    url: "https://example.com/hook",
    secret: "a".repeat(16),
    events: ["content.created"],
  };

  it("accepts valid config", () => {
    const result = webhookConfigSchema.parse(valid);
    expect(result.active).toBe(true);
  });

  it("rejects secret shorter than 16", () => {
    expect(() => webhookConfigSchema.parse({ ...valid, secret: "short" })).toThrow();
  });

  it("rejects empty events", () => {
    expect(() => webhookConfigSchema.parse({ ...valid, events: [] })).toThrow();
  });

  it("rejects invalid URL", () => {
    expect(() => webhookConfigSchema.parse({ ...valid, url: "not-a-url" })).toThrow();
  });
});

// ── Taxonomy Types ──

describe("createTaxonomySchema", () => {
  it("accepts valid taxonomy", () => {
    const result = createTaxonomySchema.parse({
      slug: "category",
      name: "Category",
    });
    expect(result.hierarchical).toBe(false);
    expect(result.contentTypes).toEqual([]);
  });
});

describe("createTermSchema", () => {
  it("accepts valid term", () => {
    const result = createTermSchema.parse({
      taxonomyId: "clh1234567890abcdef",
      name: "JavaScript",
    });
    expect(result.sortOrder).toBe(0);
  });
});

describe("updateTermSchema", () => {
  it("accepts partial update (no taxonomyId)", () => {
    const result = updateTermSchema.parse({ name: "TypeScript" });
    expect(result.name).toBe("TypeScript");
    expect(result).not.toHaveProperty("taxonomyId");
  });
});

// ── Search Types ──

describe("searchInputSchema", () => {
  it("requires query", () => {
    expect(() => searchInputSchema.parse({})).toThrow();
  });

  it("accepts valid search", () => {
    const result = searchInputSchema.parse({ query: "hello" });
    expect(result.query).toBe("hello");
    expect(result.page).toBe(1);
  });

  it("rejects query over 500 chars", () => {
    expect(() => searchInputSchema.parse({ query: "x".repeat(501) })).toThrow();
  });
});

// ── Plugin Types ──

describe("pluginManifestSchema", () => {
  const valid = { name: "SEO Toolkit", slug: "seo-toolkit", version: "1.0.0" };

  it("accepts valid manifest", () => {
    const result = pluginManifestSchema.parse(valid);
    expect(result.dependencies).toEqual([]);
    expect(result.permissions).toEqual([]);
    expect(result.settings).toEqual({});
  });

  it("rejects slug with uppercase", () => {
    expect(() =>
      pluginManifestSchema.parse({ ...valid, slug: "SEO" }),
    ).toThrow();
  });

  it("rejects slug with spaces", () => {
    expect(() =>
      pluginManifestSchema.parse({ ...valid, slug: "seo toolkit" }),
    ).toThrow();
  });
});

// ── Theme Types ──

describe("themeManifestSchema", () => {
  const valid = { name: "Default", slug: "default", version: "1.0.0" };

  it("accepts valid manifest with defaults", () => {
    const result = themeManifestSchema.parse(valid);
    expect(result.supports.menuLocations).toEqual(["primary", "footer"]);
    expect(result.supports.customColors).toBe(true);
    expect(result.supports.darkMode).toBe(false);
    expect(result.templates).toEqual([]);
    expect(result.templateChoices).toEqual([]);
  });

  it("rejects slug with uppercase", () => {
    expect(() =>
      themeManifestSchema.parse({ ...valid, slug: "Default" }),
    ).toThrow();
  });
});

// ── Revision Types ──

describe("createRevisionSchema", () => {
  it("accepts valid revision", () => {
    const result = createRevisionSchema.parse({
      contentEntryId: "clh1234567890abcdef",
    });
    expect(result.contentEntryId).toBe("clh1234567890abcdef");
  });

  it("rejects invalid CUID", () => {
    expect(() =>
      createRevisionSchema.parse({ contentEntryId: "not-cuid" }),
    ).toThrow();
  });

  it("accepts optional changeNote", () => {
    const result = createRevisionSchema.parse({
      contentEntryId: "clh1234567890abcdef",
      changeNote: "Fixed typo",
    });
    expect(result.changeNote).toBe("Fixed typo");
  });
});
