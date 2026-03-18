import { z } from "zod";
import type { BlockData } from "../validation/schemas";

export const createRevisionSchema = z.object({
  contentEntryId: z.string().cuid(),
  changeNote: z.string().max(500).optional(),
});

export type CreateRevisionInput = z.infer<typeof createRevisionSchema>;

export interface RevisionDto {
  id: string;
  contentEntryId: string;
  version: number;
  title: string;
  blocks: BlockData[];
  excerpt: string | null;
  fieldValues: Record<string, unknown>;
  author: {
    id: string;
    name: string | null;
    displayName: string | null;
  };
  changeNote: string | null;
  createdAt: Date;
}

export interface RevisionDiffDto {
  version: number;
  createdAt: Date;
  author: { id: string; name: string | null };
  changes: {
    field: string;
    before: unknown;
    after: unknown;
  }[];
}
