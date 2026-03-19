import { describe, it, expect } from "vitest";
import { compareRevisions } from "../../revision/revision-diff";
import type { RevisionDto } from "../../revision/revision-types";

function makeRevision(overrides: Partial<RevisionDto> = {}): RevisionDto {
  return {
    id: "rev-1",
    contentEntryId: "entry-1",
    version: 1,
    title: "Hello World",
    blocks: [],
    excerpt: "An excerpt",
    fieldValues: {},
    author: { id: "u-1", name: "Author", displayName: "Author" },
    changeNote: null,
    createdAt: new Date("2025-01-01"),
    ...overrides,
  };
}

describe("compareRevisions()", () => {
  it("detects title change", () => {
    const older = makeRevision({ version: 1, title: "Old Title" });
    const newer = makeRevision({ version: 2, title: "New Title" });
    const result = compareRevisions(older, newer);

    const titleChange = result.changes.find((c) => c.field === "title");
    expect(titleChange).toBeDefined();
    expect(titleChange!.type).toBe("changed");
    expect(titleChange!.before).toBe("Old Title");
    expect(titleChange!.after).toBe("New Title");
  });

  it("detects added field value", () => {
    const older = makeRevision({ version: 1, fieldValues: {} });
    const newer = makeRevision({ version: 2, fieldValues: { price: 29.99 } });
    const result = compareRevisions(older, newer);

    const fieldChange = result.changes.find((c) => c.field === "fields.price");
    expect(fieldChange).toBeDefined();
    expect(fieldChange!.type).toBe("added");
  });

  it("detects removed field value", () => {
    const older = makeRevision({ version: 1, fieldValues: { color: "red" } });
    const newer = makeRevision({ version: 2, fieldValues: {} });
    const result = compareRevisions(older, newer);

    const fieldChange = result.changes.find((c) => c.field === "fields.color");
    expect(fieldChange).toBeDefined();
    expect(fieldChange!.type).toBe("removed");
  });

  it("reports no changes for identical revisions", () => {
    const rev = makeRevision();
    const result = compareRevisions(rev, rev);
    expect(result.changes).toHaveLength(0);
    expect(result.summary).toBe("No changes");
  });

  it("includes summary with change count", () => {
    const older = makeRevision({ version: 1, title: "A" });
    const newer = makeRevision({ version: 2, title: "B" });
    const result = compareRevisions(older, newer);
    expect(result.summary).toContain("1 field");
  });
});
