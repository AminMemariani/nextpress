import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma, resetMockPrisma } from "../mocks/prisma";

vi.mock("@nextpress/db", () => ({ prisma: mockPrisma }));
vi.mock("isomorphic-dompurify", () => ({
  default: {
    sanitize: (html: string) => html.replace(/<script[^>]*>.*?<\/script>/gi, ""),
  },
}));

const { commentService } = await import("../../comment/comment-service");

import type { AuthContext } from "../../auth/auth-types";

const moderatorAuth: AuthContext = {
  user: { id: "u1", email: "mod@test.com", name: "Mod", displayName: "Moderator", image: null },
  siteId: "site-1",
  role: "editor",
  permissions: new Set(["moderate_comments", "read", "edit_profile"]),
};

const regularAuth: AuthContext = {
  user: { id: "u2", email: "user@test.com", name: "User", displayName: "User", image: null },
  siteId: "site-1",
  role: "author",
  permissions: new Set(["create_content", "read", "edit_profile"]),
};

const mockComment = {
  id: "c-1",
  siteId: "site-1",
  contentEntryId: "e-1",
  parentId: null,
  body: "Great post!",
  status: "PENDING",
  authorId: "u2",
  guestName: null,
  guestEmail: null,
  guestUrl: null,
  ip: null,
  userAgent: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  author: { id: "u2", name: "User", displayName: "User", image: null },
  contentEntry: { title: "Test Post", slug: "test-post" },
};

beforeEach(() => {
  resetMockPrisma();
});

describe("commentService.submit", () => {
  it("throws ValidationError when guest has no name/email", async () => {
    await expect(
      commentService.submit("site-1", { contentEntryId: "clh1234567890abcdef", body: "Hello" }, null),
    ).rejects.toThrow("Name and email are required");
  });

  it("throws NotFoundError for non-existent entry", async () => {
    mockPrisma.contentEntry.findFirst.mockResolvedValue(null);
    await expect(
      commentService.submit(
        "site-1",
        { contentEntryId: "clh1234567890abcdef", body: "Hello", guestName: "Guest", guestEmail: "g@t.com" },
        null,
      ),
    ).rejects.toThrow("not found");
  });

  it("throws when comments not supported", async () => {
    mockPrisma.contentEntry.findFirst.mockResolvedValue({
      id: "e-1",
      contentType: { supports: ["title", "editor"] },
    });
    await expect(
      commentService.submit(
        "site-1",
        { contentEntryId: "clh1234567890abcdef", body: "Hi", guestName: "G", guestEmail: "g@t.com" },
        null,
      ),
    ).rejects.toThrow("Comments are not enabled");
  });

  it("auto-approves moderator comments", async () => {
    mockPrisma.contentEntry.findFirst.mockResolvedValue({
      id: "e-1",
      contentType: { supports: ["comments"] },
    });
    mockPrisma.comment.create.mockResolvedValue(mockComment);

    await commentService.submit("site-1", { contentEntryId: "clh1234567890abcdef", body: "Good!" }, moderatorAuth);

    const createCall = mockPrisma.comment.create.mock.calls[0][0];
    expect(createCall.data.status).toBe("APPROVED");
  });

  it("sets PENDING for regular user comments", async () => {
    mockPrisma.contentEntry.findFirst.mockResolvedValue({
      id: "e-1",
      contentType: { supports: ["comments"] },
    });
    mockPrisma.comment.create.mockResolvedValue(mockComment);

    await commentService.submit("site-1", { contentEntryId: "clh1234567890abcdef", body: "Nice!" }, regularAuth);

    const createCall = mockPrisma.comment.create.mock.calls[0][0];
    expect(createCall.data.status).toBe("PENDING");
  });

  it("validates thread depth", async () => {
    mockPrisma.contentEntry.findFirst.mockResolvedValue({
      id: "e-1",
      contentType: { supports: ["comments"] },
    });
    mockPrisma.comment.findFirst.mockResolvedValue({ id: "parent", contentEntryId: "e-1", status: "APPROVED" });
    // Simulate depth of 3 by returning parentId chain
    mockPrisma.comment.findUnique
      .mockResolvedValueOnce({ parentId: "c-2" })
      .mockResolvedValueOnce({ parentId: "c-3" })
      .mockResolvedValueOnce({ parentId: "c-4" })
      .mockResolvedValueOnce({ parentId: null });

    await expect(
      commentService.submit(
        "site-1",
        { contentEntryId: "clh1234567890abcdef", body: "Reply", parentId: "clh1234567890parent" },
        regularAuth,
      ),
    ).rejects.toThrow("Maximum reply depth");
  });
});

describe("commentService.moderate", () => {
  it("throws NotFoundError for missing comment", async () => {
    mockPrisma.comment.findFirst.mockResolvedValue(null);
    await expect(
      commentService.moderate(moderatorAuth, "bad", "APPROVED"),
    ).rejects.toThrow("not found");
  });

  it("updates comment status", async () => {
    mockPrisma.comment.findFirst.mockResolvedValue(mockComment);
    mockPrisma.comment.update.mockResolvedValue({ ...mockComment, status: "APPROVED" });

    const result = await commentService.moderate(moderatorAuth, "c-1", "APPROVED");
    expect(result.status).toBe("APPROVED");
  });
});

describe("commentService.delete", () => {
  it("throws NotFoundError for missing", async () => {
    mockPrisma.comment.findFirst.mockResolvedValue(null);
    await expect(commentService.delete(moderatorAuth, "bad")).rejects.toThrow("not found");
  });

  it("deletes comment and its replies", async () => {
    mockPrisma.comment.findFirst.mockResolvedValue(mockComment);
    mockPrisma.comment.deleteMany.mockResolvedValue({ count: 1 });
    mockPrisma.comment.delete.mockResolvedValue({});

    await commentService.delete(moderatorAuth, "c-1");
    expect(mockPrisma.comment.deleteMany).toHaveBeenCalledWith({
      where: { parentId: "c-1", siteId: "site-1" },
    });
    expect(mockPrisma.comment.delete).toHaveBeenCalledWith({ where: { id: "c-1" } });
  });
});

describe("commentService.list", () => {
  it("returns paginated comments", async () => {
    mockPrisma.comment.findMany.mockResolvedValue([
      { ...mockComment, _count: { replies: 0 } },
    ]);
    mockPrisma.comment.count.mockResolvedValue(1);

    const result = await commentService.list("site-1", {
      page: 1,
      perPage: 20,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
  });
});

describe("commentService.countByStatus", () => {
  it("returns counts with zero defaults", async () => {
    mockPrisma.comment.groupBy.mockResolvedValue([
      { status: "PENDING", _count: { id: 5 } },
      { status: "APPROVED", _count: { id: 10 } },
    ]);

    const result = await commentService.countByStatus("site-1");
    expect(result.PENDING).toBe(5);
    expect(result.APPROVED).toBe(10);
    expect(result.SPAM).toBe(0);
    expect(result.TRASH).toBe(0);
  });
});
