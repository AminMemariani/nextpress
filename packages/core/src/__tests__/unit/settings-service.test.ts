import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma, resetMockPrisma } from "../mocks/prisma";

vi.mock("@nextpress/db", () => ({ prisma: mockPrisma }));

const { settingsService } = await import("../../settings/settings-service");

import type { AuthContext } from "../../auth/auth-types";

const adminAuth: AuthContext = {
  user: { id: "u1", email: "admin@test.com", name: "Admin", displayName: "Admin", image: null },
  siteId: "site-1",
  role: "admin",
  permissions: new Set(["manage_settings", "read", "edit_profile"]),
};

const noPermsAuth: AuthContext = {
  ...adminAuth,
  role: "subscriber",
  permissions: new Set(["read"]),
};

beforeEach(() => {
  resetMockPrisma();
});

describe("settingsService.getGroup", () => {
  it("returns defaults when no DB values", async () => {
    mockPrisma.setting.findMany.mockResolvedValue([]);
    const result = await settingsService.getGroup("site-1", "general");
    expect(result.timezone).toBe("UTC");
    expect(result.site_title).toBe("");
  });

  it("merges DB values over defaults", async () => {
    mockPrisma.setting.findMany.mockResolvedValue([
      { key: "site_title", value: "My Site" },
      { key: "timezone", value: "America/New_York" },
    ]);
    const result = await settingsService.getGroup("site-1", "general");
    expect(result.site_title).toBe("My Site");
    expect(result.timezone).toBe("America/New_York");
  });

  it("returns empty object for unknown group", async () => {
    mockPrisma.setting.findMany.mockResolvedValue([]);
    const result = await settingsService.getGroup("site-1", "nonexistent");
    expect(result).toEqual({});
  });
});

describe("settingsService.get", () => {
  it("returns DB value when present", async () => {
    mockPrisma.setting.findUnique.mockResolvedValue({ value: "My Site" });
    const result = await settingsService.get("site-1", "general", "site_title");
    expect(result).toBe("My Site");
  });

  it("falls back to default when not in DB", async () => {
    mockPrisma.setting.findUnique.mockResolvedValue(null);
    const result = await settingsService.get("site-1", "general", "timezone");
    expect(result).toBe("UTC");
  });

  it("returns undefined when not in DB or defaults", async () => {
    mockPrisma.setting.findUnique.mockResolvedValue(null);
    const result = await settingsService.get("site-1", "unknown", "unknown");
    expect(result).toBeUndefined();
  });
});

describe("settingsService.updateGroup", () => {
  it("throws without manage_settings permission", async () => {
    await expect(
      settingsService.updateGroup(noPermsAuth, { group: "general", values: {} }),
    ).rejects.toThrow("lacks permission");
  });

  it("upserts each value", async () => {
    mockPrisma.setting.upsert.mockResolvedValue({});
    mockPrisma.setting.findMany.mockResolvedValue([]);

    await settingsService.updateGroup(adminAuth, {
      group: "general",
      values: { site_title: "New", timezone: "UTC" },
    });

    expect(mockPrisma.setting.upsert).toHaveBeenCalledTimes(2);
  });
});

describe("settingsService.set", () => {
  it("upserts a single value", async () => {
    mockPrisma.setting.upsert.mockResolvedValue({});
    await settingsService.set("site-1", "general", "site_title", "New");
    expect(mockPrisma.setting.upsert).toHaveBeenCalledOnce();
  });
});

describe("settingsService.delete", () => {
  it("deletes setting", async () => {
    mockPrisma.setting.deleteMany.mockResolvedValue({ count: 1 });
    await settingsService.delete("site-1", "general", "site_title");
    expect(mockPrisma.setting.deleteMany).toHaveBeenCalledWith({
      where: { siteId: "site-1", group: "general", key: "site_title" },
    });
  });
});

describe("settingsService.registerGroup", () => {
  it("adds a plugin group", () => {
    settingsService.registerGroup({
      slug: "seo",
      name: "SEO",
      source: "seo-plugin",
      fields: [],
    });
    const groups = settingsService.getGroups();
    expect(groups.some((g) => g.slug === "seo")).toBe(true);
  });
});

describe("settingsService.getGroups", () => {
  it("includes built-in groups", () => {
    const groups = settingsService.getGroups();
    const slugs = groups.map((g) => g.slug);
    expect(slugs).toContain("general");
    expect(slugs).toContain("reading");
    expect(slugs).toContain("discussion");
    expect(slugs).toContain("permalinks");
  });
});

describe("settingsService.getGroup_def", () => {
  it("returns definition for known group", () => {
    const def = settingsService.getGroup_def("general");
    expect(def).toBeDefined();
    expect(def!.slug).toBe("general");
  });

  it("returns undefined for unknown group", () => {
    expect(settingsService.getGroup_def("unknown")).toBeUndefined();
  });
});
