import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma, resetMockPrisma } from "../mocks/prisma";

vi.mock("@nextpress/db", () => ({ prisma: mockPrisma }));

// Must import after mock
const { contentService } = await import("../../content/content-service");

import type { AuthContext } from "../../auth/auth-types";

const adminAuth: AuthContext = {
  user: { id: "u1", email: "admin@test.com", name: "Admin", displayName: "Admin", image: null },
  siteId: "site-1",
  role: "admin",
  permissions: new Set([
    "create_content", "edit_own_content", "edit_others_content",
    "delete_own_content", "delete_others_content", "publish_content",
    "read", "edit_profile",
  ]),
};

const authorAuth: AuthContext = {
  user: { id: "u2", email: "author@test.com", name: "Author", displayName: "Author", image: null },
  siteId: "site-1",
  role: "author",
  permissions: new Set([
    "create_content", "edit_own_content", "delete_own_content",
    "publish_content", "upload_media", "read", "edit_profile",
  ]),
};

const contributorAuth: AuthContext = {
  user: { id: "u3", email: "contrib@test.com", name: "Contrib", displayName: null, image: null },
  siteId: "site-1",
  role: "contributor",
  permissions: new Set([
    "create_content", "edit_own_content", "delete_own_content", "read", "edit_profile",
  ]),
};

const mockContentType = {
  id: "ct-1",
  slug: "post",
  siteId: "site-1",
  nameSingular: "Post",
  namePlural: "Posts",
  isSystem: true,
  supports: ["title", "editor", "revisions"],
  fieldDefinitions: [],
};

const mockEntry = {
  id: "e-1",
  siteId: "site-1",
  contentTypeId: "ct-1",
  title: "Test Post",
  slug: "test-post",
  excerpt: null,
  blocks: [],
  status: "DRAFT",
  password: null,
  parentId: null,
  template: null,
  menuOrder: 0,
  authorId: "u1",
  publishedAt: null,
  scheduledAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  contentType: { id: "ct-1", slug: "post", nameSingular: "Post", supports: ["title", "editor", "revisions"], fieldDefinitions: [] },
  author: { id: "u1", name: "Admin", displayName: "Admin", image: null },
  fieldValues: [],
  terms: [],
  mediaAttachments: [],
  _count: { revisions: 0, comments: 0 },
};

beforeEach(() => {
  resetMockPrisma();
});

describe("contentService.create", () => {
  it("throws AuthorizationError without create_content permission", async () => {
    const noPerms: AuthContext = { ...adminAuth, permissions: new Set(["read"]), role: "subscriber" };
    await expect(
      contentService.create(noPerms, { contentTypeSlug: "post", title: "Test" }),
    ).rejects.toThrow("lacks permission");
  });

  it("throws NotFoundError for unknown content type", async () => {
    mockPrisma.contentType.findUnique.mockResolvedValue(null);
    await expect(
      contentService.create(adminAuth, { contentTypeSlug: "unknown", title: "Test" }),
    ).rejects.toThrow("not found");
  });

  it("creates entry with correct data", async () => {
    mockPrisma.contentType.findUnique.mockResolvedValue(mockContentType);
    mockPrisma.contentEntry.findUnique.mockResolvedValue(null); // no slug collision
    mockPrisma.contentEntry.create.mockResolvedValue(mockEntry);
    // For revision creation
    mockPrisma.contentEntry.findUnique.mockResolvedValue(mockEntry);
    mockPrisma.revision.findFirst.mockResolvedValue(null);
    mockPrisma.revision.create.mockResolvedValue({ id: "r1", version: 1, author: mockEntry.author, contentEntryId: "e-1", title: "Test Post", blocks: [], excerpt: null, fieldValues: {}, changeNote: "Initial version", createdAt: new Date() });
    // For getById
    mockPrisma.contentEntry.findFirst.mockResolvedValue(mockEntry);

    const result = await contentService.create(adminAuth, {
      contentTypeSlug: "post",
      title: "Test Post",
    });

    expect(result.title).toBe("Test Post");
    expect(mockPrisma.contentEntry.create).toHaveBeenCalled();
  });

  it("throws ValidationError for SCHEDULED without scheduledAt", async () => {
    mockPrisma.contentType.findUnique.mockResolvedValue(mockContentType);
    mockPrisma.contentEntry.findUnique.mockResolvedValue(null);
    await expect(
      contentService.create(adminAuth, {
        contentTypeSlug: "post",
        title: "Test",
        status: "SCHEDULED",
      }),
    ).rejects.toThrow("scheduledAt is required");
  });

  it("throws ValidationError for SCHEDULED with past date", async () => {
    mockPrisma.contentType.findUnique.mockResolvedValue(mockContentType);
    mockPrisma.contentEntry.findUnique.mockResolvedValue(null);
    await expect(
      contentService.create(adminAuth, {
        contentTypeSlug: "post",
        title: "Test",
        status: "SCHEDULED",
        scheduledAt: new Date("2020-01-01"),
      }),
    ).rejects.toThrow("scheduledAt must be in the future");
  });

  it("throws AuthorizationError when contributor tries to publish", async () => {
    mockPrisma.contentType.findUnique.mockResolvedValue(mockContentType);
    mockPrisma.contentEntry.findUnique.mockResolvedValue(null);
    await expect(
      contentService.create(contributorAuth, {
        contentTypeSlug: "post",
        title: "Test",
        status: "PUBLISHED",
      }),
    ).rejects.toThrow();
  });
});

describe("contentService.update", () => {
  it("throws NotFoundError for non-existent entry", async () => {
    mockPrisma.contentEntry.findFirst.mockResolvedValue(null);
    await expect(
      contentService.update(adminAuth, "non-existent", { title: "New" }),
    ).rejects.toThrow("not found");
  });

  it("throws AuthorizationError when author tries to edit others content", async () => {
    mockPrisma.contentEntry.findFirst.mockResolvedValue({
      ...mockEntry,
      authorId: "other-user",
    });
    await expect(
      contentService.update(authorAuth, "e-1", { title: "New" }),
    ).rejects.toThrow();
  });

  it("validates status transition", async () => {
    const trashEntry = { ...mockEntry, status: "TRASH" };
    mockPrisma.contentEntry.findFirst.mockResolvedValue(trashEntry);
    await expect(
      contentService.update(adminAuth, "e-1", { status: "PUBLISHED" }),
    ).rejects.toThrow("Cannot transition");
  });
});

describe("contentService.delete", () => {
  it("throws NotFoundError for non-existent entry", async () => {
    mockPrisma.contentEntry.findFirst.mockResolvedValue(null);
    await expect(contentService.delete(adminAuth, "bad")).rejects.toThrow("not found");
  });

  it("throws ValidationError when not in TRASH", async () => {
    mockPrisma.contentEntry.findFirst.mockResolvedValue(mockEntry);
    await expect(contentService.delete(adminAuth, "e-1")).rejects.toThrow("TRASH");
  });

  it("deletes entry in TRASH status", async () => {
    mockPrisma.contentEntry.findFirst.mockResolvedValue({ ...mockEntry, status: "TRASH" });
    mockPrisma.contentEntry.delete.mockResolvedValue({});
    await contentService.delete(adminAuth, "e-1");
    expect(mockPrisma.contentEntry.delete).toHaveBeenCalledWith({ where: { id: "e-1" } });
  });
});

describe("contentService.getById", () => {
  it("throws NotFoundError for missing entry", async () => {
    mockPrisma.contentEntry.findFirst.mockResolvedValue(null);
    await expect(contentService.getById("site-1", "bad")).rejects.toThrow("not found");
  });

  it("returns DTO for existing entry", async () => {
    mockPrisma.contentEntry.findFirst.mockResolvedValue(mockEntry);
    const result = await contentService.getById("site-1", "e-1");
    expect(result.id).toBe("e-1");
    expect(result.title).toBe("Test Post");
  });
});

describe("contentService.getBySlug", () => {
  it("throws NotFoundError for unknown content type", async () => {
    mockPrisma.contentType.findUnique.mockResolvedValue(null);
    await expect(contentService.getBySlug("s", "post", "slug")).rejects.toThrow("not found");
  });

  it("throws NotFoundError for unknown slug", async () => {
    mockPrisma.contentType.findUnique.mockResolvedValue(mockContentType);
    mockPrisma.contentEntry.findUnique.mockResolvedValue(null);
    await expect(contentService.getBySlug("s", "post", "bad")).rejects.toThrow("not found");
  });
});

describe("contentService.list", () => {
  it("throws NotFoundError for unknown content type", async () => {
    mockPrisma.contentType.findUnique.mockResolvedValue(null);
    await expect(
      contentService.list("s1", { contentTypeSlug: "bad", page: 1, perPage: 20, sortBy: "createdAt", sortOrder: "desc" }),
    ).rejects.toThrow("not found");
  });

  it("returns paginated results", async () => {
    mockPrisma.contentType.findUnique.mockResolvedValue(mockContentType);
    mockPrisma.contentEntry.findMany.mockResolvedValue([
      { ...mockEntry, contentType: { slug: "post" }, _count: { comments: 0 } },
    ]);
    mockPrisma.contentEntry.count.mockResolvedValue(1);

    const result = await contentService.list("site-1", {
      contentTypeSlug: "post",
      page: 1,
      perPage: 20,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.totalPages).toBe(1);
  });
});
