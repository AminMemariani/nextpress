/**
 * Review/Approval Workflow
 *
 * Optional layer on top of status transitions.
 * When enabled, contributors submit content for review (PENDING_REVIEW),
 * and editors/admins approve (→ PUBLISHED) or reject (→ DRAFT + note).
 *
 * This is NOT a separate approval chain — it works within the existing
 * status transition system. The key additions:
 *   1. Submit for review: DRAFT → PENDING_REVIEW (requires create_content)
 *   2. Approve: PENDING_REVIEW → PUBLISHED (requires publish_content)
 *   3. Request changes: PENDING_REVIEW → DRAFT + review note stored in meta
 *
 * Review notes are stored as ContentMeta (key: "_review_note") so they
 * show up in the entry's field values without schema changes.
 *
 * The hook system fires "content:status_change" on every transition,
 * so plugins can send notifications (email, Slack) on submit/approve/reject.
 */

import { prisma } from "@nextpress/db";
import type { AuthContext } from "../auth/auth-types";
import { assertCan } from "../auth/permissions";
import { NotFoundError, AuthorizationError } from "../errors/cms-error";
import { hooks } from "../hooks/hook-engine";
import { contentService } from "./content-service";
import type { ContentEntryDto } from "./content-types";

export const reviewWorkflow = {
  /**
   * Submit an entry for review.
   * Changes status from DRAFT → PENDING_REVIEW.
   * Only the author (or someone with edit_others_content) can submit.
   */
  async submitForReview(
    auth: AuthContext,
    entryId: string,
    note?: string,
  ): Promise<ContentEntryDto> {
    assertCan(auth, "create_content");

    const entry = await prisma.contentEntry.findFirst({
      where: { id: entryId, siteId: auth.siteId },
    });
    if (!entry) throw new NotFoundError("ContentEntry", entryId);

    // Store review note if provided
    if (note) {
      await setReviewMeta(entryId, auth.siteId, {
        note,
        submittedBy: auth.user.id,
        submittedAt: new Date().toISOString(),
        status: "pending",
      });
    }

    const result = await contentService.transition(auth, entryId, {
      status: "PENDING_REVIEW",
    });

    return result;
  },

  /**
   * Approve a pending review → publish immediately.
   * Requires publish_content permission.
   */
  async approve(
    auth: AuthContext,
    entryId: string,
    note?: string,
  ): Promise<ContentEntryDto> {
    assertCan(auth, "publish_content");

    const entry = await prisma.contentEntry.findFirst({
      where: { id: entryId, siteId: auth.siteId, status: "PENDING_REVIEW" },
    });
    if (!entry) throw new NotFoundError("ContentEntry", entryId);

    // Update review meta
    await setReviewMeta(entryId, auth.siteId, {
      note: note ?? "Approved",
      reviewedBy: auth.user.id,
      reviewedAt: new Date().toISOString(),
      status: "approved",
    });

    const result = await contentService.publish(auth, entryId);

    return result;
  },

  /**
   * Request changes — reject back to draft with a note explaining why.
   * Requires publish_content permission.
   */
  async requestChanges(
    auth: AuthContext,
    entryId: string,
    note: string,
  ): Promise<ContentEntryDto> {
    assertCan(auth, "publish_content");

    const entry = await prisma.contentEntry.findFirst({
      where: { id: entryId, siteId: auth.siteId, status: "PENDING_REVIEW" },
    });
    if (!entry) throw new NotFoundError("ContentEntry", entryId);

    // Store rejection note
    await setReviewMeta(entryId, auth.siteId, {
      note,
      reviewedBy: auth.user.id,
      reviewedAt: new Date().toISOString(),
      status: "changes_requested",
    });

    const result = await contentService.transition(auth, entryId, {
      status: "DRAFT",
    });

    return result;
  },

  /**
   * Get the current review status and notes for an entry.
   */
  async getReviewStatus(
    siteId: string,
    entryId: string,
  ): Promise<ReviewStatus | null> {
    // Review data stored in field values with key "_review_note"
    const fieldDef = await prisma.fieldDefinition.findFirst({
      where: { siteId, key: "_review_meta" },
    });
    if (!fieldDef) return null;

    const fieldValue = await prisma.fieldValue.findFirst({
      where: { contentEntryId: entryId, fieldDefinitionId: fieldDef.id },
    });
    if (!fieldValue) return null;

    return fieldValue.value as unknown as ReviewStatus;
  },
};

// ── Types ──

export interface ReviewStatus {
  note: string;
  submittedBy?: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  status: "pending" | "approved" | "changes_requested";
}

// ── Helpers ──

async function setReviewMeta(
  entryId: string,
  siteId: string,
  data: ReviewStatus,
): Promise<void> {
  // Ensure the _review_meta field definition exists
  let fieldDef = await prisma.fieldDefinition.findFirst({
    where: { siteId, key: "_review_meta" },
  });

  if (!fieldDef) {
    fieldDef = await prisma.fieldDefinition.create({
      data: {
        siteId,
        key: "_review_meta",
        name: "Review Status",
        fieldType: "JSON",
        group: "internal",
        sortOrder: 999,
        source: "core",
      },
    });
  }

  await prisma.fieldValue.upsert({
    where: {
      contentEntryId_fieldDefinitionId: {
        contentEntryId: entryId,
        fieldDefinitionId: fieldDef.id,
      },
    },
    update: { value: data as any },
    create: {
      contentEntryId: entryId,
      fieldDefinitionId: fieldDef.id,
      value: data as any,
    },
  });
}
