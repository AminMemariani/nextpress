import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma, resetMockPrisma } from "../mocks/prisma";

vi.mock("@nextpress/db", () => ({ prisma: mockPrisma }));
vi.mock("@nextpress/blocks", () => ({
  overrideRenderComponent: vi.fn(),
}));
vi.mock("fs", () => ({
  readFileSync: vi.fn(),
  readdirSync: vi.fn().mockReturnValue([]),
  existsSync: vi.fn().mockReturnValue(false),
}));

const { themeManager } = await import("../../theme/theme-manager");

beforeEach(() => {
  resetMockPrisma();
  themeManager.reset();
  vi.clearAllMocks();
});

describe("themeManager.discover", () => {
  it("returns empty when themes dir does not exist", () => {
    const result = themeManager.discover();
    expect(result).toEqual([]);
  });

  it("discovers themes with valid manifests", async () => {
    const { existsSync, readdirSync, readFileSync } = await import("fs");
    (existsSync as any).mockReturnValue(true);
    (readdirSync as any).mockReturnValue([
      { name: "default", isDirectory: () => true },
    ]);
    (readFileSync as any).mockReturnValue(
      JSON.stringify({ name: "Default", slug: "default", version: "1.0.0" }),
    );

    const result = themeManager.discover();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("default");
  });

  it("handles invalid manifest gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { existsSync, readdirSync, readFileSync } = await import("fs");
    (existsSync as any).mockReturnValue(true);
    (readdirSync as any).mockReturnValue([
      { name: "bad-theme", isDirectory: () => true },
    ]);
    (readFileSync as any).mockReturnValue("{ bad json");

    const result = themeManager.discover();
    expect(result).toEqual([]);
    consoleSpy.mockRestore();
  });
});

describe("themeManager.getDiscovered", () => {
  it("auto-discovers if empty", () => {
    const result = themeManager.getDiscovered();
    expect(result).toEqual([]);
  });
});

describe("themeManager.getCurrent", () => {
  it("returns null when no theme loaded", () => {
    expect(themeManager.getCurrent()).toBeNull();
  });
});

describe("themeManager.reset", () => {
  it("clears active theme", () => {
    themeManager.reset();
    expect(themeManager.getCurrent()).toBeNull();
  });
});
