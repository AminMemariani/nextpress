import { describe, it, expect, beforeEach } from "vitest";
import { z } from "zod";

// Import from the blocks package directly
import {
  registerBlock,
  getBlockDefinition,
  getAllBlockDefinitions,
  validateBlockAttributes,
  migrateBlockAttributes,
} from "@nextpress/blocks";

const testSchema = z.object({
  content: z.string().default(""),
  align: z.enum(["left", "center", "right"]).default("left"),
});

describe("Block Registry", () => {
  it("registers and retrieves a block", () => {
    registerBlock({
      type: "test/paragraph",
      title: "Test Paragraph",
      icon: "type",
      category: "text",
      attributesSchema: testSchema,
      defaultAttributes: { content: "", align: "left" },
      version: 1,
      allowsInnerBlocks: false,
      source: "test",
      renderComponent: null,
    });

    const def = getBlockDefinition("test/paragraph");
    expect(def).toBeDefined();
    expect(def!.title).toBe("Test Paragraph");
  });

  it("validates block attributes", () => {
    const valid = validateBlockAttributes("test/paragraph", { content: "Hello", align: "center" });
    expect(valid.valid).toBe(true);

    const invalid = validateBlockAttributes("test/paragraph", { content: 123, align: "diagonal" });
    expect(invalid.valid).toBe(false);
  });

  it("returns error for unknown block type", () => {
    const result = validateBlockAttributes("unknown/block", {});
    expect(result.valid).toBe(false);
  });
});

describe("Block Migration", () => {
  it("migrates attributes from v1 to v2", () => {
    registerBlock({
      type: "test/migrating",
      title: "Test Migrating",
      icon: "type",
      category: "text",
      attributesSchema: z.object({ content: z.string(), align: z.string().default("left") }),
      defaultAttributes: { content: "", align: "left" },
      version: 2,
      migrate: (old, fromVersion) => {
        if (fromVersion === 1) {
          return { content: old.text ?? "", align: "left" };
        }
        return old;
      },
      allowsInnerBlocks: false,
      source: "test",
      renderComponent: null,
    });

    const migrated = migrateBlockAttributes("test/migrating", {
      text: "Hello",
      __version: 1,
    });

    expect(migrated.content).toBe("Hello");
    expect(migrated.align).toBe("left");
    expect(migrated.__version).toBe(2);
  });

  it("skips migration if already current version", () => {
    const attrs = { content: "Hello", align: "center", __version: 2 };
    const result = migrateBlockAttributes("test/migrating", attrs);
    expect(result).toEqual(attrs);
  });
});
