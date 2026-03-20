/**
 * ContentEntry Service
 *
 * The central CRUD service for all content: posts, pages, products, etc.
 * All entries are in one table, distinguished by contentTypeId.
 *
 * Responsibilities:
 *   - CRUD with site scoping
 *   - Status transitions (draft → publish, schedule, archive, trash)
 *   - Field value validation and persistence
 *   - Revision creation on every save
 *   - Taxonomy term assignment
 *   - Slug generation and uniqueness
 *
 * Authorization is checked here, not in the router. The router only
 * passes the AuthContext through.
 */

import { prisma } from "@nextpress/db";
import type { AuthContext } from "../auth/auth-types";
import { assertCan } from "../auth/permissions";
import {
  canEditContent,
  canPublishContent,
} from "../auth/permissions";
import {
  NotFoundError,
  ValidationError,
  AuthorizationError,
} from "../errors/cms-error";
import { slugify, uniqueSlug } from "../validation/slug";
import { toJsonInput } from "../prisma-helpers";
import { paginate, type PaginatedResult } from "../validation/schemas";
import { validateFields } from "../fields/field-validator";
import { revisionService } from "../revision/revision-service";
import {
  buildContentWhere,
  buildContentOrderBy,
  CONTENT_LIST_SELECT,
  CONTENT_FULL_SELECT,
} from "./content-queries";
import {
  createContentEntrySchema,
  updateContentEntrySchema,
  listContentEntriesSchema,
  STATUS_TRANSITIONS,
  type CreateContentEntryInput,
  type UpdateContentEntryInput,
  type ListContentEntriesInput,
  type StatusTransitionInput,
  type ContentEntryDto,
  type ContentEntryListDto,
  type ContentStatusInput,
} from "./content-types";

export const contentService = {
  // ────────────────────────────────────────────────────────
  // CREATE
  // ────────────────────────────────────────────────────────

  async create(
    auth: AuthContext,
    input: CreateContentEntryInput,
  ): Promise<ContentEntryDto> {
    assertCan(auth, "create_content");
    const data = createContentEntrySchema.parse(input);

    // Resolve content type
    const contentType = await prisma.contentType.findUnique({
      where: {
        siteId_slug: { siteId: auth.siteId, slug: data.contentTypeSlug },
      },
      include: { fieldDefinitions: true },
    });
    if (!contentType) {
      throw new NotFoundError("ContentType", data.contentTypeSlug);
    }

    // Validate custom fields against definitions
    const validatedFields = validateFields(
      contentType.fieldDefinitions,
      data.fields,
    );

    // Publishing requires publish_content permission
    if (data.status === "PUBLISHED" || data.status === "SCHEDULED") {
      const pubResult = canPublishContent(auth);
      if (!pubResult.granted) {
        throw new AuthorizationError(pubResult.reason);
      }
    }

    // Generate unique slug
    const slug = await uniqueSlug(
      data.slug ?? slugify(data.title),
      async (candidate) => {
        const existing = await prisma.contentEntry.findUnique({
          where: {
            siteId_contentTypeId_slug: {
              siteId: auth.siteId,
              contentTypeId: contentType.id,
              slug: candidate,
            },
          },
        });
        return !!existing;
      },
    );

    // Validate scheduled publish
    if (data.status === "SCHEDULED" && !data.scheduledAt) {
      throw new ValidationError("scheduledAt is required for SCHEDULED status");
    }
    if (data.status === "SCHEDULED" && data.scheduledAt && data.scheduledAt <= new Date()) {
      throw new ValidationError("scheduledAt must be in the future");
    }

    // Create entry + field values in a transaction
    const entry = await prisma.$transaction(async (tx) => {
      const created = await tx.contentEntry.create({
        data: {
          siteId: auth.siteId,
          contentTypeId: contentType.id,
          title: data.title,
          slug,
          excerpt: data.excerpt ?? null,
          blocks: toJsonInput(data.blocks),
          status: data.status,
          password: data.password ?? null,
          parentId: data.parentId ?? null,
          template: data.template ?? null,
          menuOrder: data.menuOrder,
          authorId: auth.user.id,
          publishedAt: data.status === "PUBLISHED" ? new Date() : null,
          scheduledAt: data.scheduledAt ?? null,
        },
      });

      // Save field values
      await saveFieldValues(tx, created.id, contentType.fieldDefinitions, validatedFields);

      // Assign taxonomy terms
      if (data.termIds.length > 0) {
        await tx.contentTerm.createMany({
          data: data.termIds.map((termId, i) => ({
            contentEntryId: created.id,
            termId,
            sortOrder: i,
          })),
          skipDuplicates: true,
        });
      }

      // Featured image
      if (data.featuredImageId) {
        await tx.contentMedia.create({
          data: {
            contentEntryId: created.id,
            mediaAssetId: data.featuredImageId,
            role: "featured_image",
            sortOrder: 0,
          },
        });
      }

      return created;
    });

    // Create initial revision (outside transaction for simplicity)
    if (contentType.supports.includes("revisions")) {
      await revisionService.create(entry.id, auth.user.id, "Initial version");
    }

    return this.getById(auth.siteId, entry.id);
  },

  // ────────────────────────────────────────────────────────
  // UPDATE
  // ────────────────────────────────────────────────────────

  async update(
    auth: AuthContext,
    entryId: string,
    input: UpdateContentEntryInput,
  ): Promise<ContentEntryDto> {
    const data = updateContentEntrySchema.parse(input);

    // Fetch existing entry
    const existing = await prisma.contentEntry.findFirst({
      where: { id: entryId, siteId: auth.siteId },
      include: {
        contentType: { include: { fieldDefinitions: true } },
      },
    });
    if (!existing) throw new NotFoundError("ContentEntry", entryId);

    // Check edit permission (ownership-aware)
    const editResult = canEditContent(auth, existing.authorId);
    if (!editResult.granted) {
      throw new AuthorizationError(editResult.reason);
    }

    // Check publish permission if status is changing to published/scheduled
    if (data.status && (data.status === "PUBLISHED" || data.status === "SCHEDULED")) {
      if (existing.status !== data.status) {
        const pubResult = canPublishContent(auth);
        if (!pubResult.granted) {
          throw new AuthorizationError(pubResult.reason);
        }
      }
    }

    // Validate status transition
    if (data.status && data.status !== existing.status) {
      validateStatusTransition(
        existing.status as ContentStatusInput,
        data.status,
      );
    }

    // Validate custom fields if provided
    let validatedFields: Record<string, unknown> | undefined;
    if (data.fields) {
      validatedFields = validateFields(
        existing.contentType.fieldDefinitions,
        data.fields,
      );
    }

    // Generate slug if changed
    let newSlug: string | undefined;
    if (data.slug && data.slug !== existing.slug) {
      newSlug = await uniqueSlug(data.slug, async (candidate) => {
        const dup = await prisma.contentEntry.findUnique({
          where: {
            siteId_contentTypeId_slug: {
              siteId: auth.siteId,
              contentTypeId: existing.contentTypeId,
              slug: candidate,
            },
          },
        });
        return !!dup && dup.id !== entryId;
      });
    }

    // Scheduled validation
    if (data.status === "SCHEDULED") {
      const schedDate = data.scheduledAt ?? existing.scheduledAt;
      if (!schedDate) {
        throw new ValidationError("scheduledAt is required for SCHEDULED status");
      }
      if (schedDate <= new Date()) {
        throw new ValidationError("scheduledAt must be in the future");
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.contentEntry.update({
        where: { id: entryId },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(newSlug !== undefined && { slug: newSlug }),
          ...(data.excerpt !== undefined && { excerpt: data.excerpt }),
          ...(data.blocks !== undefined && { blocks: toJsonInput(data.blocks) }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.password !== undefined && { password: data.password ?? null }),
          ...(data.parentId !== undefined && { parentId: data.parentId ?? null }),
          ...(data.template !== undefined && { template: data.template }),
          ...(data.menuOrder !== undefined && { menuOrder: data.menuOrder }),
          ...(data.scheduledAt !== undefined && { scheduledAt: data.scheduledAt }),
          // Set publishedAt when transitioning to PUBLISHED
          ...(data.status === "PUBLISHED" &&
            existing.status !== "PUBLISHED" && {
              publishedAt: new Date(),
            }),
        },
      });

      // Update field values
      if (validatedFields) {
        await saveFieldValues(
          tx,
          entryId,
          existing.contentType.fieldDefinitions,
          validatedFields,
        );
      }

      // Update term assignments
      if (data.termIds !== undefined) {
        await tx.contentTerm.deleteMany({ where: { contentEntryId: entryId } });
        if (data.termIds.length > 0) {
          await tx.contentTerm.createMany({
            data: data.termIds.map((termId, i) => ({
              contentEntryId: entryId,
              termId,
              sortOrder: i,
            })),
          });
        }
      }

      // Update featured image
      if (data.featuredImageId !== undefined) {
        await tx.contentMedia.deleteMany({
          where: { contentEntryId: entryId, role: "featured_image" },
        });
        if (data.featuredImageId) {
          await tx.contentMedia.create({
            data: {
              contentEntryId: entryId,
              mediaAssetId: data.featuredImageId,
              role: "featured_image",
              sortOrder: 0,
            },
          });
        }
      }
    });

    // Create revision
    if (existing.contentType.supports.includes("revisions")) {
      await revisionService.create(entryId, auth.user.id);
    }

    return this.getById(auth.siteId, entryId);
  },

  // ────────────────────────────────────────────────────────
  // STATUS TRANSITIONS
  // ────────────────────────────────────────────────────────

  /** Transition entry to a new status with validation */
  async transition(
    auth: AuthContext,
    entryId: string,
    input: StatusTransitionInput,
  ): Promise<ContentEntryDto> {
    const existing = await prisma.contentEntry.findFirst({
      where: { id: entryId, siteId: auth.siteId },
    });
    if (!existing) throw new NotFoundError("ContentEntry", entryId);

    const editResult = canEditContent(auth, existing.authorId);
    if (!editResult.granted) throw new AuthorizationError(editResult.reason);

    if (input.status === "PUBLISHED" || input.status === "SCHEDULED") {
      const pubResult = canPublishContent(auth);
      if (!pubResult.granted) throw new AuthorizationError(pubResult.reason);
    }

    validateStatusTransition(
      existing.status as ContentStatusInput,
      input.status,
    );

    return this.update(auth, entryId, {
      status: input.status,
      scheduledAt: input.scheduledAt,
    });
  },

  /** Convenience: save as draft */
  async saveDraft(
    auth: AuthContext,
    entryId: string,
    input: UpdateContentEntryInput,
  ): Promise<ContentEntryDto> {
    return this.update(auth, entryId, { ...input, status: "DRAFT" });
  },

  /** Convenience: publish */
  async publish(
    auth: AuthContext,
    entryId: string,
  ): Promise<ContentEntryDto> {
    return this.transition(auth, entryId, { status: "PUBLISHED" });
  },

  /** Convenience: schedule */
  async schedule(
    auth: AuthContext,
    entryId: string,
    scheduledAt: Date,
  ): Promise<ContentEntryDto> {
    return this.transition(auth, entryId, {
      status: "SCHEDULED",
      scheduledAt,
    });
  },

  /** Convenience: archive */
  async archive(
    auth: AuthContext,
    entryId: string,
  ): Promise<ContentEntryDto> {
    return this.transition(auth, entryId, { status: "ARCHIVED" });
  },

  /** Convenience: move to trash */
  async trash(
    auth: AuthContext,
    entryId: string,
  ): Promise<ContentEntryDto> {
    return this.transition(auth, entryId, { status: "TRASH" });
  },

  /** Convenience: restore from trash */
  async restore(
    auth: AuthContext,
    entryId: string,
  ): Promise<ContentEntryDto> {
    return this.transition(auth, entryId, { status: "DRAFT" });
  },

  // ────────────────────────────────────────────────────────
  // DELETE (permanent)
  // ────────────────────────────────────────────────────────

  async delete(auth: AuthContext, entryId: string): Promise<void> {
    const existing = await prisma.contentEntry.findFirst({
      where: { id: entryId, siteId: auth.siteId },
    });
    if (!existing) throw new NotFoundError("ContentEntry", entryId);

    // Use "delete_others_content" or "delete_own_content" based on ownership
    const perm =
      existing.authorId === auth.user.id
        ? "delete_own_content"
        : "delete_others_content";
    assertCan(auth, perm);

    // Only allow permanent delete from TRASH
    if (existing.status !== "TRASH") {
      throw new ValidationError(
        "Can only permanently delete entries in TRASH status. Move to trash first.",
      );
    }

    await prisma.contentEntry.delete({ where: { id: entryId } });
  },

  // ────────────────────────────────────────────────────────
  // READ
  // ────────────────────────────────────────────────────────

  /** Get single entry by ID */
  async getById(siteId: string, entryId: string): Promise<ContentEntryDto> {
    const entry = await prisma.contentEntry.findFirst({
      where: { id: entryId, siteId },
      select: CONTENT_FULL_SELECT,
    });
    if (!entry) throw new NotFoundError("ContentEntry", entryId);
    return toFullDto(entry);
  },

  /** Get single entry by slug + content type */
  async getBySlug(
    siteId: string,
    contentTypeSlug: string,
    slug: string,
  ): Promise<ContentEntryDto> {
    const ct = await prisma.contentType.findUnique({
      where: { siteId_slug: { siteId, slug: contentTypeSlug } },
    });
    if (!ct) throw new NotFoundError("ContentType", contentTypeSlug);

    const entry = await prisma.contentEntry.findUnique({
      where: {
        siteId_contentTypeId_slug: {
          siteId,
          contentTypeId: ct.id,
          slug,
        },
      },
      select: CONTENT_FULL_SELECT,
    });
    if (!entry) throw new NotFoundError("ContentEntry", slug);
    return toFullDto(entry);
  },

  /** List entries with filtering, searching, and pagination */
  async list(
    siteId: string,
    input: ListContentEntriesInput,
  ): Promise<PaginatedResult<ContentEntryListDto>> {
    const parsed = listContentEntriesSchema.parse(input);

    const ct = await prisma.contentType.findUnique({
      where: { siteId_slug: { siteId, slug: parsed.contentTypeSlug } },
    });
    if (!ct) throw new NotFoundError("ContentType", parsed.contentTypeSlug);

    const where = buildContentWhere(siteId, ct.id, parsed);
    const orderBy = buildContentOrderBy(parsed);
    const skip = (parsed.page - 1) * parsed.perPage;

    const [entries, total] = await Promise.all([
      prisma.contentEntry.findMany({
        where,
        orderBy,
        skip,
        take: parsed.perPage,
        select: CONTENT_LIST_SELECT,
      }),
      prisma.contentEntry.count({ where }),
    ]);

    const items: ContentEntryListDto[] = entries.map((e) => ({
      id: e.id,
      contentTypeSlug: e.contentType.slug,
      status: e.status as ContentStatusInput,
      title: e.title,
      slug: e.slug,
      excerpt: e.excerpt,
      author: e.author,
      publishedAt: e.publishedAt,
      scheduledAt: e.scheduledAt,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      commentCount: e._count.comments,
    }));

    return paginate(items, total, parsed);
  },
};

// ────────────────────────────────────────────────────────────
// Internal helpers
// ────────────────────────────────────────────────────────────

function validateStatusTransition(
  from: ContentStatusInput,
  to: ContentStatusInput,
): void {
  const allowed = STATUS_TRANSITIONS[from];
  if (!allowed?.includes(to)) {
    throw new ValidationError(
      `Cannot transition from ${from} to ${to}. Allowed: ${allowed?.join(", ") ?? "none"}`,
    );
  }
}

/**
 * Save field values using Prisma transaction client.
 *
 * The tx type from $transaction is Omit<PrismaClient, runtime methods>.
 * We use the full PrismaClient type and access fieldValue through it.
 * The Json column accepts unknown values — Prisma's InputJsonValue is
 * the correct type, but since we've already validated via Zod, we
 * cast through InputJsonValue explicitly.
 */
async function saveFieldValues(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  contentEntryId: string,
  definitions: Array<{ id: string; key: string }>,
  values: Record<string, unknown>,
): Promise<void> {
  // Use prisma directly within the transaction callback scope.
  // The `tx` parameter IS a PrismaClient-compatible object.
  const client = tx as typeof prisma;

  for (const def of definitions) {
    const value = values[def.key];
    if (value === undefined) continue;

    // Prisma's Json type accepts string | number | boolean | object | array | null
    const jsonValue = value as Parameters<typeof client.fieldValue.create>[0]["data"]["value"];

    await client.fieldValue.upsert({
      where: {
        contentEntryId_fieldDefinitionId: {
          contentEntryId,
          fieldDefinitionId: def.id,
        },
      },
      update: { value: jsonValue },
      create: {
        contentEntryId,
        fieldDefinitionId: def.id,
        value: jsonValue,
      },
    });
  }
}

// ── Prisma result type for full content entry select ──

import type { Prisma } from "@prisma/client";

type FullEntryResult = Prisma.ContentEntryGetPayload<{
  select: typeof import("./content-queries").CONTENT_FULL_SELECT;
}>;

/** Map Prisma result to ContentEntryDto with proper typing */
function toFullDto(entry: FullEntryResult): ContentEntryDto {
  const fields: Record<string, unknown> = {};
  for (const fv of entry.fieldValues) {
    fields[fv.fieldDefinition.key] = fv.value;
  }

  const featuredMedia = entry.mediaAttachments[0]?.mediaAsset ?? null;

  return {
    id: entry.id,
    siteId: entry.siteId,
    contentType: entry.contentType,
    status: entry.status as ContentEntryDto["status"],
    title: entry.title,
    slug: entry.slug,
    excerpt: entry.excerpt,
    blocks: entry.blocks as unknown as ContentEntryDto["blocks"],
    password: entry.password,
    author: entry.author,
    parentId: entry.parentId,
    menuOrder: entry.menuOrder,
    template: entry.template,
    publishedAt: entry.publishedAt,
    scheduledAt: entry.scheduledAt,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    fields,
    terms: entry.terms.map((ct) => ({
      id: ct.term.id,
      name: ct.term.name,
      slug: ct.term.slug,
      taxonomy: ct.term.taxonomy,
    })),
    featuredImage: featuredMedia,
    revisionCount: entry._count.revisions,
  };
}
