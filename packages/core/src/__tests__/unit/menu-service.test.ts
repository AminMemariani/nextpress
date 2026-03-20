import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma, resetMockPrisma } from "../mocks/prisma";

vi.mock("@nextpress/db", () => ({ prisma: mockPrisma }));

const { menuService } = await import("../../menu/menu-service");

import type { AuthContext } from "../../auth/auth-types";

const adminAuth: AuthContext = {
  user: { id: "u1", email: "admin@test.com", name: "Admin", displayName: "Admin", image: null },
  siteId: "site-1",
  role: "admin",
  permissions: new Set(["manage_menus", "read", "edit_profile"]),
};

beforeEach(() => {
  resetMockPrisma();
});

describe("menuService.getByLocation", () => {
  it("returns null when no menu exists", async () => {
    (mockPrisma as any).menu.findUnique.mockResolvedValue(null);
    const result = await menuService.getByLocation("site-1", "primary");
    expect(result).toBeNull();
  });

  it("returns menu with tree structure", async () => {
    (mockPrisma as any).menu.findUnique.mockResolvedValue({
      id: "m1",
      siteId: "site-1",
      name: "Main",
      location: "primary",
      items: [
        { id: "i1", label: "Home", url: "/", type: "custom", objectId: null, parentId: null, sortOrder: 0, cssClass: null, openInNewTab: false },
        { id: "i2", label: "About", url: "/about", type: "custom", objectId: null, parentId: "i1", sortOrder: 1, cssClass: null, openInNewTab: false },
      ],
    });
    mockPrisma.contentEntry.findMany.mockResolvedValue([]);
    mockPrisma.term.findMany.mockResolvedValue([]);

    const result = await menuService.getByLocation("site-1", "primary");
    expect(result).not.toBeNull();
    expect(result!.name).toBe("Main");
    expect(result!.items).toHaveLength(1); // "About" is child of "Home"
    expect(result!.items[0].children).toHaveLength(1);
  });

  it("resolves content item URLs", async () => {
    (mockPrisma as any).menu.findUnique.mockResolvedValue({
      id: "m1", siteId: "site-1", name: "Main", location: "primary",
      items: [
        { id: "i1", label: "Blog Post", url: null, type: "content", objectId: "e1", parentId: null, sortOrder: 0, cssClass: null, openInNewTab: false },
      ],
    });
    mockPrisma.contentEntry.findMany.mockResolvedValue([
      { id: "e1", slug: "my-blog-post" },
    ]);
    mockPrisma.term.findMany.mockResolvedValue([]);

    const result = await menuService.getByLocation("site-1", "primary");
    expect(result!.items[0].resolvedUrl).toBe("/my-blog-post");
  });

  it("resolves taxonomy item URLs", async () => {
    (mockPrisma as any).menu.findUnique.mockResolvedValue({
      id: "m1", siteId: "site-1", name: "Main", location: "primary",
      items: [
        { id: "i1", label: "JS", url: null, type: "taxonomy", objectId: "t1", parentId: null, sortOrder: 0, cssClass: null, openInNewTab: false },
      ],
    });
    mockPrisma.contentEntry.findMany.mockResolvedValue([]);
    mockPrisma.term.findMany.mockResolvedValue([
      { id: "t1", slug: "javascript", taxonomy: { slug: "tag" } },
    ]);

    const result = await menuService.getByLocation("site-1", "primary");
    expect(result!.items[0].resolvedUrl).toBe("/tag/javascript");
  });
});

describe("menuService.list", () => {
  it("returns all menus", async () => {
    (mockPrisma as any).menu.findMany.mockResolvedValue([
      {
        id: "m1", siteId: "site-1", name: "Main", location: "primary",
        items: [{ id: "i1", label: "Home", url: "/", type: "custom", objectId: null, parentId: null, sortOrder: 0, cssClass: null, openInNewTab: false }],
      },
    ]);
    mockPrisma.contentEntry.findMany.mockResolvedValue([]);
    mockPrisma.term.findMany.mockResolvedValue([]);

    const result = await menuService.list("site-1");
    expect(result).toHaveLength(1);
  });
});

describe("menuService.save", () => {
  it("upserts menu and creates items", async () => {
    (mockPrisma as any).menu.upsert.mockResolvedValue({ id: "m1", siteId: "site-1", name: "Main", location: "primary" });
    (mockPrisma as any).menuItem.deleteMany.mockResolvedValue({ count: 0 });
    (mockPrisma as any).menuItem.create.mockResolvedValue({ id: "new-i1" });
    // For getByLocation after save:
    (mockPrisma as any).menu.findUnique.mockResolvedValue({
      id: "m1", siteId: "site-1", name: "Main", location: "primary",
      items: [{ id: "new-i1", label: "Home", url: "/", type: "custom", objectId: null, parentId: null, sortOrder: 0, cssClass: null, openInNewTab: false }],
    });
    mockPrisma.contentEntry.findMany.mockResolvedValue([]);
    mockPrisma.term.findMany.mockResolvedValue([]);

    const result = await menuService.save(adminAuth, {
      location: "primary",
      name: "Main",
      items: [{ label: "Home", url: "/", type: "custom" }],
    });

    expect(result).not.toBeNull();
    expect((mockPrisma as any).menu.upsert).toHaveBeenCalled();
    expect((mockPrisma as any).menuItem.create).toHaveBeenCalled();
  });
});

describe("menuService.delete", () => {
  it("throws NotFoundError for missing menu", async () => {
    (mockPrisma as any).menu.findUnique.mockResolvedValue(null);
    await expect(menuService.delete(adminAuth, "primary")).rejects.toThrow("not found");
  });

  it("deletes menu", async () => {
    (mockPrisma as any).menu.findUnique.mockResolvedValue({ id: "m1" });
    (mockPrisma as any).menu.delete.mockResolvedValue({});
    await menuService.delete(adminAuth, "primary");
    expect((mockPrisma as any).menu.delete).toHaveBeenCalledWith({ where: { id: "m1" } });
  });
});

describe("menuService.getLocations", () => {
  it("returns default locations with hasMenu flag", async () => {
    (mockPrisma as any).themeInstall.findFirst.mockResolvedValue(null);
    (mockPrisma as any).menu.findMany.mockResolvedValue([{ location: "primary" }]);

    const result = await menuService.getLocations("site-1");
    expect(result).toHaveLength(2);
    expect(result.find((l) => l.slug === "primary")!.hasMenu).toBe(true);
    expect(result.find((l) => l.slug === "footer")!.hasMenu).toBe(false);
  });
});
