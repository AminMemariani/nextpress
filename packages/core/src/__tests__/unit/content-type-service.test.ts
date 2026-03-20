import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma, resetMockPrisma } from "../mocks/prisma";

vi.mock("@nextpress/db", () => ({ prisma: mockPrisma }));

const { contentTypeService } = await import("../../content-type/content-type-service");

import type { AuthContext } from "../../auth/auth-types";

const adminAuth: AuthContext = {
  user: { id: "u1", email: "admin@test.com", name: "Admin", displayName: "Admin", image: null },
  siteId: "site-1",
  role: "admin",
  permissions: new Set([
    "manage_content_types", "read", "edit_profile",
  ]),
};

const noPermsAuth: AuthContext = {
  ...adminAuth,
  role: "subscriber",
  permissions: new Set(["read"]),
};

const mockCt = {
  id: "ct-1",
  siteId: "site-1",
  slug: "product",
  nameSingular: "Product",
  namePlural: "Products",
  description: null,
  isSystem: false,
  hierarchical: false,
  hasArchive: true,
  isPublic: true,
  menuIcon: "file-text",
  menuPosition: 20,
  supports: ["title", "editor"],
  settings: {},
  _count: { fieldDefinitions: 0, contentEntries: 0 },
};

beforeEach(() => {
  resetMockPrisma();
});

describe("contentTypeService.create", () => {
  it("throws without manage_content_types permission", async () => {
    await expect(
      contentTypeService.create(noPermsAuth, {
        slug: "product",
        nameSingular: "Product",
        namePlural: "Products",
      }),
    ).rejects.toThrow("lacks permission");
  });

  it("creates content type", async () => {
    mockPrisma.contentType.findUnique.mockResolvedValue(null); // no slug collision
    mockPrisma.contentType.create.mockResolvedValue(mockCt);

    const result = await contentTypeService.create(adminAuth, {
      slug: "product",
      nameSingular: "Product",
      namePlural: "Products",
    });
    expect(result.slug).toBe("product");
    expect(result.nameSingular).toBe("Product");
  });
});

describe("contentTypeService.update", () => {
  it("throws NotFoundError for missing content type", async () => {
    mockPrisma.contentType.findFirst.mockResolvedValue(null);
    await expect(
      contentTypeService.update(adminAuth, "bad-id", { nameSingular: "X" }),
    ).rejects.toThrow("not found");
  });

  it("throws ValidationError for system content types", async () => {
    mockPrisma.contentType.findFirst.mockResolvedValue({ ...mockCt, isSystem: true });
    await expect(
      contentTypeService.update(adminAuth, "ct-1", { nameSingular: "X" }),
    ).rejects.toThrow("system content types");
  });

  it("updates non-system content type", async () => {
    mockPrisma.contentType.findFirst.mockResolvedValue(mockCt);
    mockPrisma.contentType.update.mockResolvedValue({ ...mockCt, nameSingular: "Item" });

    const result = await contentTypeService.update(adminAuth, "ct-1", {
      nameSingular: "Item",
    });
    expect(result.nameSingular).toBe("Item");
  });
});

describe("contentTypeService.delete", () => {
  it("throws NotFoundError for missing", async () => {
    mockPrisma.contentType.findFirst.mockResolvedValue(null);
    await expect(contentTypeService.delete(adminAuth, "bad")).rejects.toThrow("not found");
  });

  it("throws for system content types", async () => {
    mockPrisma.contentType.findFirst.mockResolvedValue({ ...mockCt, isSystem: true });
    await expect(contentTypeService.delete(adminAuth, "ct-1")).rejects.toThrow("system");
  });

  it("throws when content type has entries", async () => {
    mockPrisma.contentType.findFirst.mockResolvedValue({
      ...mockCt,
      _count: { contentEntries: 5, fieldDefinitions: 0 },
    });
    await expect(contentTypeService.delete(adminAuth, "ct-1")).rejects.toThrow("5 existing entries");
  });

  it("deletes empty content type", async () => {
    mockPrisma.contentType.findFirst.mockResolvedValue(mockCt);
    mockPrisma.contentType.delete.mockResolvedValue({});
    await contentTypeService.delete(adminAuth, "ct-1");
    expect(mockPrisma.contentType.delete).toHaveBeenCalledWith({ where: { id: "ct-1" } });
  });
});

describe("contentTypeService.getBySlug", () => {
  it("throws for unknown slug", async () => {
    mockPrisma.contentType.findUnique.mockResolvedValue(null);
    await expect(contentTypeService.getBySlug("s", "bad")).rejects.toThrow("not found");
  });

  it("returns DTO", async () => {
    mockPrisma.contentType.findUnique.mockResolvedValue(mockCt);
    const result = await contentTypeService.getBySlug("site-1", "product");
    expect(result.slug).toBe("product");
  });
});

describe("contentTypeService.list", () => {
  it("returns all content types for site", async () => {
    mockPrisma.contentType.findMany.mockResolvedValue([mockCt]);
    const result = await contentTypeService.list("site-1");
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("product");
  });
});
