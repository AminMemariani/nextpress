/**
 * Revision Diff Engine
 *
 * Compares two revisions or a revision against the current entry state.
 * Produces a list of field-level changes for display in the admin UI.
 *
 * Diff strategy:
 *   - Title, excerpt: string comparison (exact match or changed)
 *   - Blocks: deep JSON comparison, reports block-level adds/removes/edits
 *   - Field values: per-key comparison with JSON stringify for deep equality
 *
 * This is a STRUCTURAL diff, not a text diff. We report "field X changed
 * from A to B", not "line 3 character 5 changed". Text-level diffing
 * (word-by-word highlighting) is a UI concern handled in the component.
 */

import type { RevisionDto, RevisionDiffDto } from "./revision-types";
import type { BlockData } from "../validation/schemas";

export interface FieldChange {
  field: string;
  label: string;
  type: "added" | "removed" | "changed" | "unchanged";
  before: unknown;
  after: unknown;
}

export interface RevisionComparison {
  fromVersion: number;
  toVersion: number;
  fromDate: Date;
  toDate: Date;
  fromAuthor: { id: string; name: string | null };
  toAuthor: { id: string; name: string | null };
  changes: FieldChange[];
  summary: string;
}

/**
 * Compare two revisions and produce a structured diff.
 */
export function compareRevisions(
  older: RevisionDto,
  newer: RevisionDto,
): RevisionComparison {
  const changes: FieldChange[] = [];

  // Title
  changes.push(diffField("title", "Title", older.title, newer.title));

  // Excerpt
  changes.push(diffField("excerpt", "Excerpt", older.excerpt, newer.excerpt));

  // Blocks
  const blocksChanged = !deepEqual(older.blocks, newer.blocks);
  changes.push({
    field: "blocks",
    label: "Content",
    type: blocksChanged ? "changed" : "unchanged",
    before: blocksChanged ? summarizeBlocks(older.blocks) : null,
    after: blocksChanged ? summarizeBlocks(newer.blocks) : null,
  });

  // Field values
  const allKeys = new Set([
    ...Object.keys(older.fieldValues),
    ...Object.keys(newer.fieldValues),
  ]);

  for (const key of allKeys) {
    const oldVal = older.fieldValues[key];
    const newVal = newer.fieldValues[key];

    if (oldVal === undefined && newVal !== undefined) {
      changes.push({ field: `fields.${key}`, label: key, type: "added", before: null, after: newVal });
    } else if (oldVal !== undefined && newVal === undefined) {
      changes.push({ field: `fields.${key}`, label: key, type: "removed", before: oldVal, after: null });
    } else if (!deepEqual(oldVal, newVal)) {
      changes.push({ field: `fields.${key}`, label: key, type: "changed", before: oldVal, after: newVal });
    }
  }

  const changedCount = changes.filter((c) => c.type !== "unchanged").length;
  const summary = changedCount === 0
    ? "No changes"
    : `${changedCount} field${changedCount > 1 ? "s" : ""} changed`;

  return {
    fromVersion: older.version,
    toVersion: newer.version,
    fromDate: older.createdAt,
    toDate: newer.createdAt,
    fromAuthor: older.author,
    toAuthor: newer.author,
    changes: changes.filter((c) => c.type !== "unchanged"),
    summary,
  };
}

/**
 * Build a RevisionDiffDto for the API (matches the existing type).
 */
export function buildRevisionDiff(
  older: RevisionDto,
  newer: RevisionDto,
): RevisionDiffDto {
  const comparison = compareRevisions(older, newer);
  return {
    version: newer.version,
    createdAt: newer.createdAt,
    author: newer.author,
    changes: comparison.changes.map((c) => ({
      field: c.field,
      before: c.before,
      after: c.after,
    })),
  };
}

// ── Helpers ──

function diffField(
  field: string,
  label: string,
  before: unknown,
  after: unknown,
): FieldChange {
  if (before === after) return { field, label, type: "unchanged", before, after };
  if (before == null && after != null) return { field, label, type: "added", before, after };
  if (before != null && after == null) return { field, label, type: "removed", before, after };
  return { field, label, type: "changed", before, after };
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function summarizeBlocks(blocks: BlockData[]): string {
  const count = countBlocks(blocks);
  const types = new Set<string>();
  walkBlocks(blocks, (b) => types.add(b.type));
  return `${count} block${count !== 1 ? "s" : ""} (${Array.from(types).join(", ")})`;
}

function countBlocks(blocks: BlockData[]): number {
  let n = 0;
  walkBlocks(blocks, () => n++);
  return n;
}

function walkBlocks(blocks: BlockData[], fn: (b: BlockData) => void): void {
  for (const b of blocks) {
    fn(b);
    if (b.innerBlocks?.length) walkBlocks(b.innerBlocks, fn);
  }
}
