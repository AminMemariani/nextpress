import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma, resetMockPrisma } from "../mocks/prisma";

vi.mock("@nextpress/db", () => ({ prisma: mockPrisma }));

const { reviewWorkflow } = await import("../../content/review-workflow");

import type { AuthContext } from "../../auth/auth-types";

const editorAuth: AuthContext = {
  user: { id: "u1", email: "editor@test.com", name: "Editor", displayName: "Editor", image: null },
  siteId: "site-1",
  role: "editor",
  permissions: new Set([
    "create_content", "edit_own_content", "edit_others_content",
    "publish_content", "read", "edit_profile",
  ]),
};

const authorAuth: AuthContext = {
  user: { id: "u2", email: "author@test.com", name: "Author", displayName: "Author", image: null },
  siteId: "site-1",
  role: "author",
  permissions: new Set([
    "create_content", "edit_own_content", "publish_content", "read", "edit_profile",
  ]),
};

const mockEntry = {
  id: "e-1",
  siteId: "site-1",
  contentTypeId: "ct-1",
  title: "Draft Post",
  slug: "draft-post",
  status: "DRAFT",
  authorId: "u2",
  publishedAt: null,
  scheduledAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  contentType: { id: "ct-1", slug: "post", nameSingular: "Post", supports: ["title", "editor"], fieldDefinitions: [] },
  author: { id: "u2", name: "Author", displayName: "Author", image: null },
  fieldValues: [],
  terms: [],
  mediaAttachments: [],
  _count: { revisions: 0, comments: 0 },
  excerpt: null,
  blocks: [],
  password: null,
  parentId: null,
  template: null,
  menuOrder: 0,
};

beforeEach(() => {
  resetMockPrisma();
});

describe("reviewWorkflow.submitForReview", () => {
  it("throws without create_content permission", async () => {
    const noPerms: AuthContext = { ...editorAuth, permissions: new Set(["read"]), role: "subscriber" };
    await expect(
      reviewWorkflow.submitForReview(noPerms, "e-1"),
    ).rejects.toThrow();
  });

  it("throws NotFoundError for missing entry", async () => {
    mockPrisma.contentEntry.findFirst.mockResolvedValue(null);
    await expect(
      reviewWorkflow.submitForReview(authorAuth, "bad"),
    ).rejects.toThrow("not found");
  });

  it("stores review note when provided", async () => {
    // First call: submitForReview finds entry (DRAFT)
    // Second call: transition finds entry (DRAFT)
    // Third call: update internally finds entry (for canEditContent)
    // Fourth call: getById after update
    mockPrisma.contentEntry.findFirst
      .mockResolvedValueOnce(mockEntry) // submitForReview
      .mockResolvedValueOnce(mockEntry) // transition finds entry
      .mockResolvedValueOnce({ ...mockEntry, contentType: { ...mockEntry.contentType, fieldDefinitions: [] } }) // update finds entry
      .mockResolvedValueOnce({ ...mockEntry, status: "PENDING_REVIEW" }); // getById result

    // For setReviewMeta: find existing field def
    mockPrisma.fieldDefinition.findFirst.mockResolvedValue({ id: "fd-review" });
    mockPrisma.fieldValue.upsert.mockResolvedValue({});

    // For update -> $transaction
    mockPrisma.contentEntry.update.mockResolvedValue({ ...mockEntry, status: "PENDING_REVIEW" });

    await reviewWorkflow.submitForReview(authorAuth, "e-1", "Please review");

    expect(mockPrisma.fieldValue.upsert).toHaveBeenCalled();
  });
});

describe("reviewWorkflow.approve", () => {
  it("throws without publish_content permission", async () => {
    const noPerms: AuthContext = { ...editorAuth, permissions: new Set(["read", "create_content"]), role: "contributor" };
    await expect(
      reviewWorkflow.approve(noPerms, "e-1"),
    ).rejects.toThrow();
  });

  it("throws NotFoundError for non-pending entry", async () => {
    mockPrisma.contentEntry.findFirst.mockResolvedValue(null);
    await expect(
      reviewWorkflow.approve(editorAuth, "e-1"),
    ).rejects.toThrow("not found");
  });
});

describe("reviewWorkflow.requestChanges", () => {
  it("throws NotFoundError for non-pending entry", async () => {
    mockPrisma.contentEntry.findFirst.mockResolvedValue(null);
    await expect(
      reviewWorkflow.requestChanges(editorAuth, "e-1", "Fix typo"),
    ).rejects.toThrow("not found");
  });
});

describe("reviewWorkflow.getReviewStatus", () => {
  it("returns null when no review field exists", async () => {
    mockPrisma.fieldDefinition.findFirst.mockResolvedValue(null);
    const result = await reviewWorkflow.getReviewStatus("site-1", "e-1");
    expect(result).toBeNull();
  });

  it("returns null when no review value exists", async () => {
    mockPrisma.fieldDefinition.findFirst.mockResolvedValue({ id: "fd-review" });
    mockPrisma.fieldValue.findFirst.mockResolvedValue(null);
    const result = await reviewWorkflow.getReviewStatus("site-1", "e-1");
    expect(result).toBeNull();
  });

  it("returns review status", async () => {
    mockPrisma.fieldDefinition.findFirst.mockResolvedValue({ id: "fd-review" });
    mockPrisma.fieldValue.findFirst.mockResolvedValue({
      value: { note: "LGTM", status: "approved", reviewedBy: "u1" },
    });
    const result = await reviewWorkflow.getReviewStatus("site-1", "e-1");
    expect(result).not.toBeNull();
    expect(result!.status).toBe("approved");
  });
});
