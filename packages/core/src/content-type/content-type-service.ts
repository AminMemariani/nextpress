/**
 * ContentType Service
 *
 * Manages content type definitions (post, page, product, etc.)
 * Content types are per-site and stored in the DB so they survive restarts
 * and can be registered by plugins without schema changes.
 */

import { prisma } from "@nextpress/db";
import type { AuthContext } from "../auth/auth-types";
import { assertCan } from "../auth/permissions";
import { NotFoundError, ValidationError } from "../errors/cms-error";
import { slugify, uniqueSlug } from "../validation/slug";
import {
  createContentTypeSchema,
  updateContentTypeSchema,
  type CreateContentTypeInput,
  type UpdateContentTypeInput,
  type ContentTypeDto,
} from "./content-type-types";

export const contentTypeService = {
  /** Create a new content type for a site */
  async create(
    auth: AuthContext,
    input: CreateContentTypeInput,
  ): Promise<ContentTypeDto> {
    assertCan(auth, "manage_content_types");
    const data = createContentTypeSchema.parse(input);

    // Generate unique slug
    const slug = await uniqueSlug(data.slug, async (candidate) => {
      const existing = await prisma.contentType.findUnique({
        where: { siteId_slug: { siteId: auth.siteId, slug: candidate } },
      });
      return !!existing;
    });

    const ct = await prisma.contentType.create({
      data: {
        siteId: auth.siteId,
        slug,
        nameSingular: data.nameSingular,
        namePlural: data.namePlural,
        description: data.description ?? null,
        hierarchical: data.hierarchical,
        hasArchive: data.hasArchive,
        isPublic: data.isPublic,
        menuIcon: data.menuIcon,
        menuPosition: data.menuPosition,
        supports: data.supports,
        settings: data.settings,
        isSystem: false,
      },
      include: {
        _count: { select: { fieldDefinitions: true, contentEntries: true } },
      },
    });

    return toDto(ct);
  },

  /** Update an existing content type */
  async update(
    auth: AuthContext,
    contentTypeId: string,
    input: UpdateContentTypeInput,
  ): Promise<ContentTypeDto> {
    assertCan(auth, "manage_content_types");
    const data = updateContentTypeSchema.parse(input);

    const existing = await prisma.contentType.findFirst({
      where: { id: contentTypeId, siteId: auth.siteId },
    });
    if (!existing) throw new NotFoundError("ContentType", contentTypeId);
    if (existing.isSystem) {
      throw new ValidationError("Cannot modify system content types");
    }

    const ct = await prisma.contentType.update({
      where: { id: contentTypeId },
      data: {
        ...(data.nameSingular !== undefined && { nameSingular: data.nameSingular }),
        ...(data.namePlural !== undefined && { namePlural: data.namePlural }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.hierarchical !== undefined && { hierarchical: data.hierarchical }),
        ...(data.hasArchive !== undefined && { hasArchive: data.hasArchive }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
        ...(data.menuIcon !== undefined && { menuIcon: data.menuIcon }),
        ...(data.menuPosition !== undefined && { menuPosition: data.menuPosition }),
        ...(data.supports !== undefined && { supports: data.supports }),
        ...(data.settings !== undefined && { settings: data.settings }),
      },
      include: {
        _count: { select: { fieldDefinitions: true, contentEntries: true } },
      },
    });

    return toDto(ct);
  },

  /** Delete a content type (must have no entries) */
  async delete(auth: AuthContext, contentTypeId: string): Promise<void> {
    assertCan(auth, "manage_content_types");

    const ct = await prisma.contentType.findFirst({
      where: { id: contentTypeId, siteId: auth.siteId },
      include: { _count: { select: { contentEntries: true } } },
    });
    if (!ct) throw new NotFoundError("ContentType", contentTypeId);
    if (ct.isSystem) {
      throw new ValidationError("Cannot delete system content types");
    }
    if (ct._count.contentEntries > 0) {
      throw new ValidationError(
        `Cannot delete content type with ${ct._count.contentEntries} existing entries. Delete or reassign entries first.`,
      );
    }

    await prisma.contentType.delete({ where: { id: contentTypeId } });
  },

  /** Get a single content type by slug */
  async getBySlug(
    siteId: string,
    slug: string,
  ): Promise<ContentTypeDto> {
    const ct = await prisma.contentType.findUnique({
      where: { siteId_slug: { siteId, slug } },
      include: {
        _count: { select: { fieldDefinitions: true, contentEntries: true } },
      },
    });
    if (!ct) throw new NotFoundError("ContentType", slug);
    return toDto(ct);
  },

  /** List all content types for a site */
  async list(siteId: string): Promise<ContentTypeDto[]> {
    const types = await prisma.contentType.findMany({
      where: { siteId },
      orderBy: { menuPosition: "asc" },
      include: {
        _count: { select: { fieldDefinitions: true, contentEntries: true } },
      },
    });
    return types.map(toDto);
  },

  /** Get content type by ID, ensuring site scope */
  async getById(siteId: string, id: string): Promise<ContentTypeDto> {
    const ct = await prisma.contentType.findFirst({
      where: { id, siteId },
      include: {
        _count: { select: { fieldDefinitions: true, contentEntries: true } },
      },
    });
    if (!ct) throw new NotFoundError("ContentType", id);
    return toDto(ct);
  },
};

// ── Mapping helper ──

type ContentTypeWithCount = Awaited<
  ReturnType<typeof prisma.contentType.findFirst>
> & {
  _count: { fieldDefinitions: number; contentEntries: number };
};

function toDto(ct: NonNullable<ContentTypeWithCount>): ContentTypeDto {
  return {
    id: ct.id,
    siteId: ct.siteId,
    slug: ct.slug,
    nameSingular: ct.nameSingular,
    namePlural: ct.namePlural,
    description: ct.description,
    isSystem: ct.isSystem,
    hierarchical: ct.hierarchical,
    hasArchive: ct.hasArchive,
    isPublic: ct.isPublic,
    menuIcon: ct.menuIcon,
    menuPosition: ct.menuPosition,
    supports: ct.supports,
    settings: ct.settings as Record<string, unknown>,
    fieldCount: ct._count.fieldDefinitions,
    entryCount: ct._count.contentEntries,
  };
}
