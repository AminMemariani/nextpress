import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma, resetMockPrisma } from "../mocks/prisma";

vi.mock("@nextpress/db", () => ({ prisma: mockPrisma }));
vi.mock("@nextpress/blocks", () => ({
  registerBlock: vi.fn(),
  unregisterBlock: vi.fn(),
}));

const { PluginContext } = await import("../../plugin/plugin-context");
const { hooks } = await import("../../hooks/hook-engine");

import type { AuthContext } from "../../auth/auth-types";

const adminAuth: AuthContext = {
  user: { id: "u1", email: "admin@test.com", name: "Admin", displayName: "Admin", image: null },
  siteId: "site-1",
  role: "admin",
  permissions: new Set([
    "manage_content_types", "manage_fields", "manage_settings",
    "manage_taxonomies", "read", "edit_profile",
  ]),
};

let ctx: InstanceType<typeof PluginContext>;

beforeEach(() => {
  resetMockPrisma();
  hooks.reset();
  ctx = new PluginContext("test-plugin", adminAuth);
});

describe("PluginContext.hooks", () => {
  it("registers actions with plugin slug as source", async () => {
    const fn = vi.fn();
    ctx.hooks.addAction("content:after_save", fn);
    expect(hooks.hasHandlers("content:after_save")).toBe(true);
    expect(hooks.getHandlerCount("content:after_save")).toBe(1);
  });

  it("registers filters with plugin slug as source", () => {
    ctx.hooks.addFilter("render:excerpt", ((s: string) => s.toUpperCase()) as any);
    expect(hooks.hasHandlers("render:excerpt")).toBe(true);
  });

  it("supports priority parameter", () => {
    ctx.hooks.addAction("content:after_save", vi.fn(), 5);
    expect(hooks.getHandlerCount("content:after_save")).toBe(1);
  });
});

describe("PluginContext.admin", () => {
  it("registers admin pages", () => {
    ctx.admin.registerPage({
      slug: "seo-settings",
      label: "SEO Settings",
      href: "/admin/plugins/seo",
    });
    const pages = ctx.admin.getPages();
    expect(pages).toHaveLength(1);
    expect(pages[0].slug).toBe("seo-settings");
  });

  it("returns copy of pages array", () => {
    ctx.admin.registerPage({ slug: "p1", label: "P1", href: "/p1" });
    const pages1 = ctx.admin.getPages();
    const pages2 = ctx.admin.getPages();
    expect(pages1).not.toBe(pages2);
    expect(pages1).toEqual(pages2);
  });

  it("registers sidebar panels", () => {
    ctx.admin.registerSidebarPanel({
      slug: "seo-panel",
      title: "SEO",
      component: () => Promise.resolve({ default: () => null }),
    });
    const panels = ctx.admin.getSidebarPanels();
    expect(panels).toHaveLength(1);
    expect(panels[0].slug).toBe("seo-panel");
  });
});

describe("PluginContext.api", () => {
  it("registers API routes with correct path prefix", () => {
    const handler = vi.fn();
    ctx.api.registerRoute("GET", "/status", handler as any);
    const routes = ctx.api.getRoutes();
    expect(routes).toHaveLength(1);
    expect(routes[0].path).toBe("/api/v1/plugins/test-plugin/status");
    expect(routes[0].method).toBe("GET");
  });

  it("registers multiple routes", () => {
    ctx.api.registerRoute("GET", "/a", vi.fn() as any);
    ctx.api.registerRoute("POST", "/b", vi.fn() as any);
    expect(ctx.api.getRoutes()).toHaveLength(2);
  });

  it("returns copy of routes array", () => {
    ctx.api.registerRoute("GET", "/x", vi.fn() as any);
    const r1 = ctx.api.getRoutes();
    const r2 = ctx.api.getRoutes();
    expect(r1).not.toBe(r2);
  });
});

describe("PluginContext.blocks", () => {
  it("registers blocks with plugin source", async () => {
    const { registerBlock } = await import("@nextpress/blocks");
    ctx.blocks.register({ type: "custom-cta", name: "CTA", category: "common" } as any);
    expect(registerBlock).toHaveBeenCalledWith(
      expect.objectContaining({ type: "custom-cta", source: "test-plugin" }),
    );
  });

  it("unregisters blocks", async () => {
    const { unregisterBlock } = await import("@nextpress/blocks");
    ctx.blocks.unregister("custom-cta");
    expect(unregisterBlock).toHaveBeenCalledWith("custom-cta");
  });
});

describe("PluginContext.settings", () => {
  it("gets plugin settings with prefixed group", async () => {
    mockPrisma.setting.findMany.mockResolvedValue([]);
    await ctx.settings.get();
    expect(mockPrisma.setting.findMany).toHaveBeenCalledWith({
      where: { siteId: "site-1", group: "plugin:test-plugin" },
    });
  });

  it("updates plugin settings with prefixed group", async () => {
    mockPrisma.setting.upsert.mockResolvedValue({});
    mockPrisma.setting.findMany.mockResolvedValue([]);
    await ctx.settings.update({ key: "value" });
    expect(mockPrisma.setting.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          siteId_group_key: expect.objectContaining({ group: "plugin:test-plugin" }),
        }),
      }),
    );
  });
});

describe("PluginContext.taxonomies", () => {
  it("creates taxonomy with site scope", async () => {
    mockPrisma.taxonomy.create.mockResolvedValue({
      id: "t-1",
      slug: "genre",
      name: "Genre",
    });
    await ctx.taxonomies.register({
      slug: "genre",
      name: "Genre",
      contentTypes: ["post"],
    });
    expect(mockPrisma.taxonomy.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        siteId: "site-1",
        slug: "genre",
        isSystem: false,
      }),
    });
  });
});
