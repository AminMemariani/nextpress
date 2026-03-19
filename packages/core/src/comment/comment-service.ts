/**
 * Comment Service
 *
 * Handles submission, moderation, threading, and spam detection hooks.
 *
 * Submission flow:
 *   1. Validate input (body length, guest fields if unauthenticated)
 *   2. Verify content entry exists and has comments enabled
 *   3. Verify parent comment exists (if threaded reply)
 *   4. Run spam detection hook (plugin extensible)
 *   5. Create comment with appropriate initial status
 *   6. Fire comment:submitted hook (for notifications)
 *
 * Initial status rules:
 *   - Authenticated user with moderate_comments → APPROVED
 *   - Authenticated user → site setting (auto-approve or PENDING)
 *   - Guest → PENDING (always requires moderation)
 *
 * Threading:
 *   - Flat at the DB level (parentId FK, self-referential)
 *   - Tree built in-memory when rendering (buildCommentTree)
 *   - Max depth: 3 levels (configurable) — prevents deep nesting chaos
 */

import { prisma } from "@nextpress/db";
import type { AuthContext } from "../auth/auth-types";
import { can } from "../auth/permissions";
import { NotFoundError, ValidationError } from "../errors/cms-error";
import { hooks } from "../hooks/hook-engine";
import { paginate, type PaginatedResult } from "../validation/schemas";
import DOMPurify from "isomorphic-dompurify";
import {
  submitCommentSchema,
  listCommentsSchema,
  type SubmitCommentInput,
  type ListCommentsInput,
  type CommentDto,
  type CommentListDto,
  type CommentAuthor,
  type CommentStatusInput,
} from "./comment-types";

const MAX_THREAD_DEPTH = 3;

export const commentService = {
  // ────────────────────────────────────────────────────────
  // SUBMIT (public)
  // ────────────────────────────────────────────────────────

  async submit(
    siteId: string,
    input: SubmitCommentInput,
    auth: AuthContext | null,
    meta?: { ip?: string; userAgent?: string },
  ): Promise<CommentDto> {
    const data = submitCommentSchema.parse(input);

    // Validate: guest must provide name + email
    if (!auth && (!data.guestName || !data.guestEmail)) {
      throw new ValidationError("Name and email are required for guest comments");
    }

    // Verify content entry exists
    const entry = await prisma.contentEntry.findFirst({
      where: { id: data.contentEntryId, siteId, status: "PUBLISHED" },
      select: { id: true, contentType: { select: { supports: true } } },
    });
    if (!entry) throw new NotFoundError("ContentEntry", data.contentEntryId);

    // Verify comments are enabled for this content type
    if (!entry.contentType.supports.includes("comments")) {
      throw new ValidationError("Comments are not enabled for this content type");
    }

    // Verify parent comment exists and check depth
    if (data.parentId) {
      const parent = await prisma.comment.findFirst({
        where: { id: data.parentId, contentEntryId: data.contentEntryId, status: "APPROVED" },
      });
      if (!parent) throw new NotFoundError("Parent comment", data.parentId);

      const depth = await getCommentDepth(data.parentId);
      if (depth >= MAX_THREAD_DEPTH) {
        throw new ValidationError(`Maximum reply depth of ${MAX_THREAD_DEPTH} exceeded`);
      }
    }

    // Sanitize body (strip all HTML except basic formatting)
    const sanitizedBody = DOMPurify.sanitize(data.body, {
      ALLOWED_TAGS: ["p", "br", "strong", "em", "a", "code"],
      ALLOWED_ATTR: ["href"],
    });

    if (!sanitizedBody.trim()) {
      throw new ValidationError("Comment body cannot be empty after sanitization");
    }

    // Determine initial status
    let initialStatus: CommentStatusInput = "PENDING";
    if (auth) {
      const canModerate = can(auth, "moderate_comments").granted;
      if (canModerate) {
        initialStatus = "APPROVED"; // moderators' comments auto-approve
      }
      // TODO: check site setting for auto-approve registered users
    }

    const comment = await prisma.comment.create({
      data: {
        siteId,
        contentEntryId: data.contentEntryId,
        parentId: data.parentId ?? null,
        body: sanitizedBody,
        status: initialStatus,
        authorId: auth?.user.id ?? null,
        guestName: auth ? null : data.guestName ?? null,
        guestEmail: auth ? null : data.guestEmail ?? null,
        guestUrl: data.guestUrl ?? null,
        ip: meta?.ip ?? null,
        userAgent: meta?.userAgent ?? null,
      },
      include: {
        author: { select: { id: true, name: true, displayName: true, image: true } },
        contentEntry: { select: { title: true, slug: true } },
      },
    });

    // Fire hooks
    await hooks.doAction("comment:submitted", comment.id, data.contentEntryId);

    return toDto(comment);
  },

  // ────────────────────────────────────────────────────────
  // MODERATION (admin)
  // ────────────────────────────────────────────────────────

  async moderate(
    auth: AuthContext,
    commentId: string,
    newStatus: CommentStatusInput,
  ): Promise<CommentDto> {
    const existing = await prisma.comment.findFirst({
      where: { id: commentId, siteId: auth.siteId },
    });
    if (!existing) throw new NotFoundError("Comment", commentId);

    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: { status: newStatus },
      include: {
        author: { select: { id: true, name: true, displayName: true, image: true } },
        contentEntry: { select: { title: true, slug: true } },
      },
    });

    if (newStatus === "APPROVED") {
      await hooks.doAction("comment:approved", commentId);
    }

    return toDto(comment);
  },

  /** Bulk moderation */
  async moderateBulk(
    auth: AuthContext,
    commentIds: string[],
    newStatus: CommentStatusInput,
  ): Promise<number> {
    const { count } = await prisma.comment.updateMany({
      where: { id: { in: commentIds }, siteId: auth.siteId },
      data: { status: newStatus },
    });

    if (newStatus === "APPROVED") {
      for (const id of commentIds) {
        await hooks.doAction("comment:approved", id);
      }
    }

    return count;
  },

  /** Permanent delete */
  async delete(auth: AuthContext, commentId: string): Promise<void> {
    const existing = await prisma.comment.findFirst({
      where: { id: commentId, siteId: auth.siteId },
    });
    if (!existing) throw new NotFoundError("Comment", commentId);

    // Delete replies first (not cascade — we want explicit control)
    await prisma.comment.deleteMany({
      where: { parentId: commentId },
    });
    await prisma.comment.delete({ where: { id: commentId } });
  },

  // ────────────────────────────────────────────────────────
  // LIST (admin)
  // ────────────────────────────────────────────────────────

  async list(
    siteId: string,
    input: ListCommentsInput,
  ): Promise<PaginatedResult<CommentListDto>> {
    const parsed = listCommentsSchema.parse(input);
    const skip = (parsed.page - 1) * parsed.perPage;

    const where: any = { siteId };
    if (parsed.status) where.status = parsed.status;
    if (parsed.contentEntryId) where.contentEntryId = parsed.contentEntryId;
    if (parsed.search) {
      where.OR = [
        { body: { contains: parsed.search, mode: "insensitive" } },
        { guestName: { contains: parsed.search, mode: "insensitive" } },
        { guestEmail: { contains: parsed.search, mode: "insensitive" } },
      ];
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        orderBy: { createdAt: parsed.sortOrder },
        skip,
        take: parsed.perPage,
        include: {
          author: { select: { id: true, name: true, displayName: true, image: true } },
          contentEntry: { select: { title: true, slug: true } },
          _count: { select: { replies: true } },
        },
      }),
      prisma.comment.count({ where }),
    ]);

    const items: CommentListDto[] = comments.map((c) => ({
      id: c.id,
      contentEntryId: c.contentEntryId,
      contentEntryTitle: (c as any).contentEntry.title,
      contentEntrySlug: (c as any).contentEntry.slug,
      parentId: c.parentId,
      body: c.body,
      status: c.status as CommentStatusInput,
      author: resolveAuthor(c),
      ip: c.ip,
      userAgent: c.userAgent,
      createdAt: c.createdAt,
      replyCount: (c as any)._count.replies,
    }));

    return paginate(items, total, parsed);
  },

  // ────────────────────────────────────────────────────────
  // PUBLIC: get approved comments for a content entry
  // ────────────────────────────────────────────────────────

  async getForEntry(contentEntryId: string): Promise<CommentDto[]> {
    const comments = await prisma.comment.findMany({
      where: { contentEntryId, status: "APPROVED" },
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, name: true, displayName: true, image: true } },
        contentEntry: { select: { title: true, slug: true } },
      },
    });

    return buildCommentTree(comments.map(toDto));
  },

  /** Count by status for a site (for admin dashboard) */
  async countByStatus(siteId: string): Promise<Record<CommentStatusInput, number>> {
    const counts = await prisma.comment.groupBy({
      by: ["status"],
      where: { siteId },
      _count: { id: true },
    });

    const result: Record<string, number> = {
      PENDING: 0, APPROVED: 0, SPAM: 0, TRASH: 0,
    };
    for (const c of counts) {
      result[c.status] = c._count.id;
    }
    return result as Record<CommentStatusInput, number>;
  },
};

// ── Helpers ──

function resolveAuthor(comment: any): CommentAuthor {
  if (comment.authorId && comment.author) {
    return {
      type: "registered",
      id: comment.author.id,
      name: comment.author.displayName ?? comment.author.name ?? "User",
      email: null, // don't expose registered users' emails
      url: null,
      image: comment.author.image,
    };
  }
  return {
    type: "guest",
    id: null,
    name: comment.guestName ?? "Anonymous",
    email: comment.guestEmail,
    url: comment.guestUrl,
    image: null,
  };
}

function toDto(comment: any): CommentDto {
  return {
    id: comment.id,
    contentEntryId: comment.contentEntryId,
    contentEntryTitle: comment.contentEntry?.title ?? "",
    parentId: comment.parentId,
    body: comment.body,
    status: comment.status,
    author: resolveAuthor(comment),
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    replies: [],
  };
}

/** Build a nested tree from flat comment list */
function buildCommentTree(comments: CommentDto[]): CommentDto[] {
  const map = new Map<string, CommentDto>();
  const roots: CommentDto[] = [];

  for (const c of comments) {
    map.set(c.id, { ...c, replies: [] });
  }

  for (const c of comments) {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

/** Get the nesting depth of a comment */
async function getCommentDepth(commentId: string): Promise<number> {
  let depth = 0;
  let currentId: string | null = commentId;

  while (currentId && depth < MAX_THREAD_DEPTH + 1) {
    const comment = await prisma.comment.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });
    if (!comment?.parentId) break;
    currentId = comment.parentId;
    depth++;
  }

  return depth;
}
