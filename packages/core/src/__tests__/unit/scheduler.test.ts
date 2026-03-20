import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma, resetMockPrisma } from "../mocks/prisma";

vi.mock("@nextpress/db", () => ({ prisma: mockPrisma }));

const { scheduler } = await import("../../scheduling/scheduler");
const { hooks } = await import("../../hooks/hook-engine");

beforeEach(() => {
  resetMockPrisma();
  hooks.reset();
});

describe("scheduler.publishScheduledEntries", () => {
  it("returns zero when no scheduled entries", async () => {
    mockPrisma.contentEntry.findMany.mockResolvedValue([]);
    const result = await scheduler.publishScheduledEntries();
    expect(result.published).toBe(0);
    expect(result.ids).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it("publishes due entries", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    mockPrisma.contentEntry.findMany.mockResolvedValue([
      { id: "e1", title: "Post 1", siteId: "s1", contentType: { slug: "post", nameSingular: "Post" } },
      { id: "e2", title: "Post 2", siteId: "s1", contentType: { slug: "post", nameSingular: "Post" } },
    ]);
    mockPrisma.contentEntry.update.mockResolvedValue({});
    mockPrisma.contentEntry.findUnique.mockResolvedValue(null); // hooks won't fire

    const result = await scheduler.publishScheduledEntries();
    expect(result.published).toBe(2);
    expect(result.ids).toEqual(["e1", "e2"]);
    expect(mockPrisma.contentEntry.update).toHaveBeenCalledTimes(2);
    consoleSpy.mockRestore();
  });

  it("captures errors without blocking other entries", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    mockPrisma.contentEntry.findMany.mockResolvedValue([
      { id: "e1", title: "Good", siteId: "s1", contentType: { slug: "post" } },
      { id: "e2", title: "Bad", siteId: "s1", contentType: { slug: "post" } },
    ]);
    mockPrisma.contentEntry.update
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("DB error"));
    mockPrisma.contentEntry.findUnique.mockResolvedValue(null);

    const result = await scheduler.publishScheduledEntries();
    expect(result.published).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].id).toBe("e2");
    consoleSpy.mockRestore();
  });

  it("fires lifecycle hooks", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const hookFn = vi.fn();
    hooks.addAction("content:published", "test", hookFn);

    mockPrisma.contentEntry.findMany.mockResolvedValue([
      { id: "e1", title: "Post", siteId: "s1", contentType: { slug: "post" } },
    ]);
    mockPrisma.contentEntry.update.mockResolvedValue({});
    mockPrisma.contentEntry.findUnique.mockResolvedValue({
      id: "e1", status: "PUBLISHED",
      contentType: { id: "ct1", slug: "post", nameSingular: "Post" },
      author: { id: "u1", name: "Admin", displayName: "Admin", image: null },
    });

    await scheduler.publishScheduledEntries();
    expect(hookFn).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe("scheduler.pruneAllRevisions", () => {
  it("returns 0 when no entries need pruning", async () => {
    mockPrisma.$queryRaw = vi.fn().mockResolvedValue([]);
    const result = await scheduler.pruneAllRevisions();
    expect(result).toBe(0);
  });

  it("prunes excess revisions", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    mockPrisma.$queryRaw = vi.fn().mockResolvedValue([
      { contentEntryId: "e1", count: 30n },
    ]);
    mockPrisma.revision.findMany.mockResolvedValue(
      Array.from({ length: 30 }, (_, i) => ({ id: `r-${i}` })),
    );
    mockPrisma.revision.deleteMany.mockResolvedValue({ count: 5 });

    const result = await scheduler.pruneAllRevisions(25);
    expect(result).toBe(5);
    consoleSpy.mockRestore();
  });
});
