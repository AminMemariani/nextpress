/**
 * Plugin testing pattern.
 *
 * Shows how to test a plugin's registration, hook integration,
 * and cleanup lifecycle without running the full app.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { hooks } from "../../hooks/hook-engine";
import { PluginContext } from "../../plugin/plugin-context";
import { mockAuth } from "../setup";

describe("Plugin lifecycle testing", () => {
  beforeEach(() => {
    hooks.reset(); // clean slate
  });

  it("registers hooks on activate", async () => {
    const ctx = new PluginContext("test-plugin", mockAuth());

    // Simulate plugin activation
    ctx.hooks.addAction("content:published", async (entry) => {
      // Plugin logic here
    });

    ctx.hooks.addFilter("render:meta_tags", async (tags, entry) => {
      return { ...tags, "plugin-tag": "value" };
    });

    expect(hooks.getHandlerCount("content:published")).toBe(1);
    expect(hooks.getHandlerCount("render:meta_tags")).toBe(1);
  });

  it("removes hooks on deactivate", () => {
    const ctx = new PluginContext("test-plugin", mockAuth());

    ctx.hooks.addAction("content:published", async () => {});
    ctx.hooks.addAction("content:after_save", async () => {});

    expect(hooks.getHandlerCount()).toBe(2);

    // Simulate deactivation
    hooks.removeBySource("test-plugin");

    expect(hooks.getHandlerCount()).toBe(0);
  });

  it("filters transform data through pipeline", async () => {
    const ctx = new PluginContext("test-plugin", mockAuth());

    ctx.hooks.addFilter("render:meta_tags", async (tags) => {
      return { ...tags, custom: "added-by-plugin" };
    });

    const result = await hooks.applyFilters(
      "render:meta_tags",
      { title: "Original" } as any,
      {} as any,
    );

    expect(result.title).toBe("Original");
    expect((result as any).custom).toBe("added-by-plugin");
  });

  it("actions fire in priority order", async () => {
    const order: number[] = [];
    const ctx = new PluginContext("test-plugin", mockAuth());

    ctx.hooks.addAction("content:published", async () => { order.push(20); }, 20);
    ctx.hooks.addAction("content:published", async () => { order.push(5); }, 5);
    ctx.hooks.addAction("content:published", async () => { order.push(10); }, 10);

    await hooks.doAction("content:published", {} as any);

    expect(order).toEqual([5, 10, 20]);
  });

  it("one handler error doesn't stop others", async () => {
    const ctx = new PluginContext("test-plugin", mockAuth());
    const results: string[] = [];

    ctx.hooks.addAction("content:published", async () => { results.push("first"); }, 1);
    ctx.hooks.addAction("content:published", async () => { throw new Error("boom"); }, 2);
    ctx.hooks.addAction("content:published", async () => { results.push("third"); }, 3);

    await hooks.doAction("content:published", {} as any);

    expect(results).toEqual(["first", "third"]);
  });
});

describe("Theme testing pattern", () => {
  it("template resolver picks correct template", async () => {
    const { resolveTemplate } = await import("../../theme/template-resolver");

    const templates = new Map<string, any>();
    templates.set("single-post", () => "post template");
    templates.set("single", () => "generic single");
    templates.set("index", () => "fallback");

    const { resolvedSlug } = resolveTemplate(templates, {
      pageType: "single",
      contentTypeSlug: "post",
      entrySlug: "hello",
    });

    expect(resolvedSlug).toBe("single-post");
  });

  it("block overrides apply correctly", async () => {
    const { registerBlock, getBlockDefinition, overrideRenderComponent } = await import("@nextpress/blocks");
    const { z } = await import("zod");

    // Register a core block
    registerBlock({
      type: "test/themed-block",
      title: "Test",
      icon: "test",
      category: "text",
      attributesSchema: z.object({ content: z.string() }),
      defaultAttributes: { content: "" },
      version: 1,
      allowsInnerBlocks: false,
      source: "core",
      renderComponent: () => "core-render" as any,
    });

    // Theme overrides the render
    const themeRender = () => "theme-render" as any;
    overrideRenderComponent("test/themed-block", themeRender);

    const def = getBlockDefinition("test/themed-block");
    expect(def?.renderComponent).toBe(themeRender);
  });
});
