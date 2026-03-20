import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma, resetMockPrisma } from "../mocks/prisma";

vi.mock("@nextpress/db", () => ({ prisma: mockPrisma }));

const { revisionService } = await import("../../revision/revision-service");

const mockEntry = {
  id: "e-1",
  title: "Test Post",
  blocks: [{ id: "b1", type: "paragraph", attributes: { text: "hi" } }],
  excerpt: "Summary",
  fieldValues: [
    { value: "hello", fieldDefinition: { key: "subtitle" } },
  ],
};

const mockRevision = {
  id: "r-1",
  contentEntryId: "e-1",
  version: 1,
  title: "Test Post",
  blocks: [],
  excerpt: "Summary",
  fieldValues: { subtitle: "hello" },
  changeNote: null,
  createdAt: new Date(),
  authorId: "u1",
  author: { id: "u1", name: "Admin", displayName: "Admin" },
};

beforeEach(() => {
  resetMockPrisma();
});

describe("revisionService.create", () => {
  it("throws NotFoundError for missing entry", async () => {
    mockPrisma.contentEntry.findUnique.mockResolvedValue(null);
    await expect(revisionService.create("bad", "u1")).rejects.toThrow("not found");
  });

  it("creates revision with next version number", async () => {
    mockPrisma.contentEntry.findUnique.mockResolvedValue(mockEntry);
    mockPrisma.revision.findFirst.mockResolvedValue({ version: 3 });
    mockPrisma.revision.create.mockResolvedValue({ ...mockRevision, version: 4 });

    const result = await revisionService.create("e-1", "u1", "Updated content");
    expect(mockPrisma.revision.create).toHaveBeenCalled();
    const createArgs = mockPrisma.revision.create.mock.calls[0][0].data;
    expect(createArgs.version).toBe(4);
    expect(result.version).toBe(4);
  });

  it("starts at version 1 when no prior revisions", async () => {
    mockPrisma.contentEntry.findUnique.mockResolvedValue(mockEntry);
    mockPrisma.revision.findFirst.mockResolvedValue(null);
    mockPrisma.revision.create.mockResolvedValue(mockRevision);

    await revisionService.create("e-1", "u1");
    const createArgs = mockPrisma.revision.create.mock.calls[0][0].data;
    expect(createArgs.version).toBe(1);
  });

  it("snapshots field values as key-value pairs", async () => {
    mockPrisma.contentEntry.findUnique.mockResolvedValue(mockEntry);
    mockPrisma.revision.findFirst.mockResolvedValue(null);
    mockPrisma.revision.create.mockResolvedValue(mockRevision);

    await revisionService.create("e-1", "u1");
    const createArgs = mockPrisma.revision.create.mock.calls[0][0].data;
    expect(createArgs.fieldValues).toEqual({ subtitle: "hello" });
  });
});

describe("revisionService.list", () => {
  it("returns revisions newest first", async () => {
    mockPrisma.revision.findMany.mockResolvedValue([
      { ...mockRevision, version: 2 },
      { ...mockRevision, version: 1 },
    ]);

    const result = await revisionService.list("e-1");
    expect(result).toHaveLength(2);
    expect(result[0].version).toBe(2);
  });
});

describe("revisionService.getById", () => {
  it("throws NotFoundError for missing revision", async () => {
    mockPrisma.revision.findUnique.mockResolvedValue(null);
    await expect(revisionService.getById("bad")).rejects.toThrow("not found");
  });

  it("returns revision DTO", async () => {
    mockPrisma.revision.findUnique.mockResolvedValue(mockRevision);
    const result = await revisionService.getById("r-1");
    expect(result.id).toBe("r-1");
    expect(result.version).toBe(1);
  });
});

describe("revisionService.restore", () => {
  it("throws NotFoundError for missing revision", async () => {
    mockPrisma.revision.findUnique.mockResolvedValue(null);
    await expect(revisionService.restore("bad", "u1")).rejects.toThrow("not found");
  });

  it("restores entry and creates new revisions", async () => {
    // First call: restore finds the revision
    mockPrisma.revision.findUnique.mockResolvedValue(mockRevision);
    // For create calls during restore:
    mockPrisma.contentEntry.findUnique.mockResolvedValue(mockEntry);
    mockPrisma.revision.findFirst.mockResolvedValue({ version: 1 });
    mockPrisma.revision.create.mockResolvedValue({ ...mockRevision, version: 2 });
    mockPrisma.contentEntry.update.mockResolvedValue({});
    mockPrisma.fieldDefinition.findMany.mockResolvedValue([]);

    const result = await revisionService.restore("r-1", "u1");
    expect(result.entryId).toBe("e-1");
    expect(result.restoredVersion).toBe(1);
    expect(mockPrisma.contentEntry.update).toHaveBeenCalled();
  });
});

describe("revisionService.prune", () => {
  it("does nothing when under limit", async () => {
    mockPrisma.revision.findMany.mockResolvedValue(
      Array.from({ length: 10 }, (_, i) => ({ id: `r-${i}` })),
    );

    const result = await revisionService.prune("e-1", 25);
    expect(result).toBe(0);
    expect(mockPrisma.revision.deleteMany).not.toHaveBeenCalled();
  });

  it("prunes revisions beyond keepCount", async () => {
    const revisions = Array.from({ length: 30 }, (_, i) => ({ id: `r-${i}` }));
    mockPrisma.revision.findMany.mockResolvedValue(revisions);
    mockPrisma.revision.deleteMany.mockResolvedValue({ count: 5 });

    const result = await revisionService.prune("e-1", 25);
    expect(result).toBe(5);
    expect(mockPrisma.revision.deleteMany).toHaveBeenCalled();
    const deleteArgs = mockPrisma.revision.deleteMany.mock.calls[0][0];
    expect(deleteArgs.where.id.in).toHaveLength(5);
  });

  it("uses default keepCount of 25", async () => {
    const revisions = Array.from({ length: 26 }, (_, i) => ({ id: `r-${i}` }));
    mockPrisma.revision.findMany.mockResolvedValue(revisions);
    mockPrisma.revision.deleteMany.mockResolvedValue({ count: 1 });

    const result = await revisionService.prune("e-1");
    expect(result).toBe(1);
  });
});
