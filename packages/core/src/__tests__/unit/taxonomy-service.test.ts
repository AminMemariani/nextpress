import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma, resetMockPrisma } from "../mocks/prisma";

vi.mock("@nextpress/db", () => ({ prisma: mockPrisma }));

const { taxonomyService } = await import("../../taxonomy/taxonomy-service");

import type { AuthContext } from "../../auth/auth-types";

const adminAuth: AuthContext = {
  user: { id: "u1", email: "admin@test.com", name: "Admin", displayName: "Admin", image: null },
  siteId: "site-1",
  role: "admin",
  permissions: new Set(["manage_taxonomies", "manage_categories", "read", "edit_profile"]),
};

const noPermsAuth: AuthContext = {
  ...adminAuth,
  role: "subscriber",
  permissions: new Set(["read"]),
};

const mockTaxonomy = {
  id: "tax-1",
  siteId: "site-1",
  slug: "category",
  name: "Category",
  description: null,
  hierarchical: false,
  isSystem: false,
  isPublic: true,
  contentTypes: [],
  _count: { terms: 0 },
};

const mockTerm = {
  id: "t-1",
  taxonomyId: "tax-1",
  name: "JavaScript",
  slug: "javascript",
  description: null,
  parentId: null,
  sortOrder: 0,
  meta: {},
  _count: { contents: 0 },
};

beforeEach(() => {
  resetMockPrisma();
});

describe("taxonomyService.create", () => {
  it("throws without manage_taxonomies permission", async () => {
    await expect(
      taxonomyService.create(noPermsAuth, { slug: "tag", name: "Tag" }),
    ).rejects.toThrow("lacks permission");
  });

  it("creates taxonomy", async () => {
    mockPrisma.taxonomy.create.mockResolvedValue(mockTaxonomy);

    const result = await taxonomyService.create(adminAuth, {
      slug: "category",
      name: "Category",
    });
    expect(result.slug).toBe("category");
    expect(result.name).toBe("Category");
  });
});

describe("taxonomyService.list", () => {
  it("returns all taxonomies for site", async () => {
    mockPrisma.taxonomy.findMany.mockResolvedValue([mockTaxonomy]);
    const result = await taxonomyService.list("site-1");
    expect(result).toHaveLength(1);
  });
});

describe("taxonomyService.getBySlug", () => {
  it("throws NotFoundError for unknown slug", async () => {
    mockPrisma.taxonomy.findUnique.mockResolvedValue(null);
    await expect(taxonomyService.getBySlug("s", "bad")).rejects.toThrow("not found");
  });

  it("returns DTO", async () => {
    mockPrisma.taxonomy.findUnique.mockResolvedValue(mockTaxonomy);
    const result = await taxonomyService.getBySlug("site-1", "category");
    expect(result.slug).toBe("category");
  });
});

describe("taxonomyService.delete", () => {
  it("throws for system taxonomies", async () => {
    mockPrisma.taxonomy.findFirst.mockResolvedValue({ ...mockTaxonomy, isSystem: true });
    await expect(taxonomyService.delete(adminAuth, "tax-1")).rejects.toThrow("system");
  });

  it("deletes non-system taxonomy", async () => {
    mockPrisma.taxonomy.findFirst.mockResolvedValue(mockTaxonomy);
    mockPrisma.taxonomy.delete.mockResolvedValue({});
    await taxonomyService.delete(adminAuth, "tax-1");
    expect(mockPrisma.taxonomy.delete).toHaveBeenCalled();
  });
});

describe("taxonomyService.createTerm", () => {
  it("throws for unknown taxonomy", async () => {
    mockPrisma.taxonomy.findUnique.mockResolvedValue(null);
    await expect(
      taxonomyService.createTerm(adminAuth, {
        taxonomyId: "clh1234567890abcdef",
        name: "Test",
      }),
    ).rejects.toThrow("not found");
  });

  it("creates term with generated slug", async () => {
    mockPrisma.taxonomy.findUnique.mockResolvedValue(mockTaxonomy);
    mockPrisma.term.findUnique.mockResolvedValue(null); // no slug collision
    mockPrisma.term.create.mockResolvedValue(mockTerm);

    const result = await taxonomyService.createTerm(adminAuth, {
      taxonomyId: "clh1234567890abcdef",
      name: "JavaScript",
    });
    expect(result.name).toBe("JavaScript");
  });
});

describe("taxonomyService.updateTerm", () => {
  it("updates term", async () => {
    mockPrisma.term.update.mockResolvedValue({ ...mockTerm, name: "TypeScript" });
    const result = await taxonomyService.updateTerm(adminAuth, "t-1", { name: "TypeScript" });
    expect(result.name).toBe("TypeScript");
  });
});

describe("taxonomyService.deleteTerm", () => {
  it("deletes term", async () => {
    mockPrisma.term.delete.mockResolvedValue({});
    await taxonomyService.deleteTerm(adminAuth, "t-1");
    expect(mockPrisma.term.delete).toHaveBeenCalledWith({ where: { id: "t-1" } });
  });
});

describe("taxonomyService.listTerms", () => {
  it("returns tree structure", async () => {
    const parent = { ...mockTerm, id: "t-1", parentId: null };
    const child = { ...mockTerm, id: "t-2", name: "Node.js", parentId: "t-1" };
    mockPrisma.term.findMany.mockResolvedValue([parent, child]);

    const result = await taxonomyService.listTerms("tax-1");
    expect(result).toHaveLength(1);
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children[0].name).toBe("Node.js");
  });
});
