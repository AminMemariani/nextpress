import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma, resetMockPrisma } from "../mocks/prisma";

vi.mock("@nextpress/db", () => ({ prisma: mockPrisma }));
vi.mock("fs", () => ({
  readFileSync: vi.fn(),
  readdirSync: vi.fn().mockReturnValue([]),
  existsSync: vi.fn().mockReturnValue(false),
}));

const { pluginManager } = await import("../../plugin/plugin-manager");
const { hooks } = await import("../../hooks/hook-engine");

import type { AuthContext } from "../../auth/auth-types";

const adminAuth: AuthContext = {
  user: { id: "u1", email: "admin@test.com", name: "Admin", displayName: "Admin", image: null },
  siteId: "site-1",
  role: "admin",
  permissions: new Set(["manage_plugins", "manage_content_types", "manage_fields", "read", "edit_profile"]),
};

beforeEach(() => {
  resetMockPrisma();
  hooks.reset();
  pluginManager.reset();
});

describe("pluginManager.discover", () => {
  it("returns empty when plugins dir does not exist", () => {
    const result = pluginManager.discover();
    expect(result).toEqual([]);
  });

  it("discovers plugins with valid manifests", async () => {
    const { existsSync, readdirSync, readFileSync } = await import("fs");
    (existsSync as any).mockReturnValue(true);
    (readdirSync as any).mockReturnValue([
      { name: "seo-toolkit", isDirectory: () => true },
      { name: "_internal", isDirectory: () => true }, // should be skipped
      { name: "readme.md", isDirectory: () => false }, // not a dir
    ]);
    (readFileSync as any).mockReturnValue(
      JSON.stringify({ name: "SEO Toolkit", slug: "seo-toolkit", version: "1.0.0" }),
    );

    const result = pluginManager.discover();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("seo-toolkit");
  });

  it("handles invalid manifest gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { existsSync, readdirSync, readFileSync } = await import("fs");
    (existsSync as any).mockReturnValue(true);
    (readdirSync as any).mockReturnValue([
      { name: "bad-plugin", isDirectory: () => true },
    ]);
    (readFileSync as any).mockReturnValue("{ invalid json");

    const result = pluginManager.discover();
    expect(result).toEqual([]);
    consoleSpy.mockRestore();
  });
});

describe("pluginManager.getDiscovered", () => {
  it("calls discover if empty", () => {
    const result = pluginManager.getDiscovered();
    expect(result).toEqual([]);
  });
});

describe("pluginManager.activate", () => {
  it("throws for unknown plugin", async () => {
    await expect(pluginManager.activate("unknown", adminAuth)).rejects.toThrow("Plugin not found");
  });
});

describe("pluginManager.deactivate", () => {
  it("removes hooks and updates DB", async () => {
    hooks.addAction("content:after_save", "test-plugin", vi.fn());
    mockPrisma.pluginInstall.updateMany.mockResolvedValue({ count: 1 });

    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await pluginManager.deactivate("test-plugin", adminAuth);
    expect(hooks.hasHandlers("content:after_save")).toBe(false);
    expect(mockPrisma.pluginInstall.updateMany).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe("pluginManager.getState", () => {
  it("returns plugin states from DB", async () => {
    mockPrisma.pluginInstall.findMany.mockResolvedValue([
      { slug: "seo", version: "1.0", isActive: true, settings: {}, activatedAt: new Date() },
    ]);

    const result = await pluginManager.getState("site-1");
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("seo");
  });
});

describe("pluginManager.getAllLoaded", () => {
  it("returns empty initially", () => {
    expect(pluginManager.getAllLoaded()).toEqual([]);
  });
});

describe("pluginManager.getLoaded", () => {
  it("returns undefined for unknown plugin", () => {
    expect(pluginManager.getLoaded("unknown")).toBeUndefined();
  });
});

describe("pluginManager.reset", () => {
  it("clears all loaded plugins", () => {
    pluginManager.reset();
    expect(pluginManager.getAllLoaded()).toEqual([]);
  });
});

describe("pluginManager.bootActivePlugins", () => {
  it("loads nothing when no active plugins", async () => {
    mockPrisma.pluginInstall.findMany.mockResolvedValue([]);
    await pluginManager.bootActivePlugins(adminAuth);
    expect(pluginManager.getAllLoaded()).toEqual([]);
  });
});
