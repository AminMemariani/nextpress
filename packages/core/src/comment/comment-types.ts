import { z } from "zod";
import { paginationSchema, sortOrderSchema } from "../validation/schemas";

// ── Status ──

export const commentStatusSchema = z.enum(["PENDING", "APPROVED", "SPAM", "TRASH"]);
export type CommentStatusInput = z.infer<typeof commentStatusSchema>;

// ── Submit (public) ──

export const submitCommentSchema = z.object({
  contentEntryId: z.string().cuid(),
  parentId: z.string().cuid().optional().nullable(),
  body: z.string().min(1).max(10_000),
  // Guest fields (required if not authenticated)
  guestName: z.string().min(1).max(200).optional(),
  guestEmail: z.string().email().optional(),
  guestUrl: z.string().url().max(500).optional().nullable(),
});

export type SubmitCommentInput = z.infer<typeof submitCommentSchema>;

// ── List (admin) ──

export const listCommentsSchema = paginationSchema.extend({
  status: commentStatusSchema.optional(),
  contentEntryId: z.string().cuid().optional(),
  search: z.string().max(200).optional(),
  sortBy: z.enum(["createdAt"]).default("createdAt"),
  sortOrder: sortOrderSchema,
});

export type ListCommentsInput = z.infer<typeof listCommentsSchema>;

// ── Moderation (admin) ──

export const moderateCommentSchema = z.object({
  status: commentStatusSchema,
});

// ── Output DTOs ──

export interface CommentDto {
  id: string;
  contentEntryId: string;
  contentEntryTitle: string;
  parentId: string | null;
  body: string;
  status: CommentStatusInput;
  author: CommentAuthor;
  createdAt: Date;
  updatedAt: Date;
  replies: CommentDto[];
}

export interface CommentAuthor {
  type: "registered" | "guest";
  id: string | null;
  name: string;
  email: string | null;
  url: string | null;
  image: string | null;
}

/** Flat comment for admin list views (no nested replies) */
export interface CommentListDto {
  id: string;
  contentEntryId: string;
  contentEntryTitle: string;
  contentEntrySlug: string;
  parentId: string | null;
  body: string;
  status: CommentStatusInput;
  author: CommentAuthor;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
  replyCount: number;
}
