/**
 * FieldDefinition Service
 *
 * Manages custom field schemas for content types.
 * Each FieldDefinition declares a field's key, type, validation rules,
 * and UI metadata. The actual values are in FieldValue rows.
 */

import { prisma } from "@nextpress/db";
import type { AuthContext } from "../auth/auth-types";
import { assertCan } from "../auth/permissions";
import { NotFoundError, ValidationError } from "../errors/cms-error";
import {
  createFieldDefinitionSchema,
  updateFieldDefinitionSchema,
  type CreateFieldDefinitionInput,
  type UpdateFieldDefinitionInput,
  type FieldDefinitionDto,
} from "./field-types";

export const fieldService = {
  /** Add a field definition to a content type (or site-global if no contentTypeId) */
  async create(
    auth: AuthContext,
    input: CreateFieldDefinitionInput,
    source: string = "core",
  ): Promise<FieldDefinitionDto> {
    assertCan(auth, "manage_fields");
    const data = createFieldDefinitionSchema.parse(input);

    // If scoped to a content type, verify it exists and belongs to this site
    if (data.contentTypeId) {
      const ct = await prisma.contentType.findFirst({
        where: { id: data.contentTypeId, siteId: auth.siteId },
      });
      if (!ct) throw new NotFoundError("ContentType", data.contentTypeId);
    }

    // Check for duplicate key within the same scope
    const existing = await prisma.fieldDefinition.findUnique({
      where: {
        siteId_contentTypeId_key: {
          siteId: auth.siteId,
          contentTypeId: data.contentTypeId ?? "",
          key: data.key,
        },
      },
    });
    if (existing) {
      throw new ValidationError(`Field key "${data.key}" already exists`);
    }

    const fd = await prisma.fieldDefinition.create({
      data: {
        siteId: auth.siteId,
        contentTypeId: data.contentTypeId ?? null,
        key: data.key,
        name: data.name,
        description: data.description ?? null,
        fieldType: data.fieldType,
        isRequired: data.isRequired,
        defaultValue: data.defaultValue ?? undefined,
        validation: data.validation ?? undefined,
        options: data.options ?? undefined,
        group: data.group,
        sortOrder: data.sortOrder,
        source,
      },
    });

    return toDto(fd);
  },

  /** Update a field definition */
  async update(
    auth: AuthContext,
    fieldId: string,
    input: UpdateFieldDefinitionInput,
  ): Promise<FieldDefinitionDto> {
    assertCan(auth, "manage_fields");
    const data = updateFieldDefinitionSchema.parse(input);

    const existing = await prisma.fieldDefinition.findFirst({
      where: { id: fieldId, siteId: auth.siteId },
    });
    if (!existing) throw new NotFoundError("FieldDefinition", fieldId);

    const fd = await prisma.fieldDefinition.update({
      where: { id: fieldId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.fieldType !== undefined && { fieldType: data.fieldType }),
        ...(data.isRequired !== undefined && { isRequired: data.isRequired }),
        ...(data.defaultValue !== undefined && { defaultValue: data.defaultValue }),
        ...(data.validation !== undefined && { validation: data.validation }),
        ...(data.options !== undefined && { options: data.options }),
        ...(data.group !== undefined && { group: data.group }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });

    return toDto(fd);
  },

  /** Delete a field definition and its values */
  async delete(auth: AuthContext, fieldId: string): Promise<void> {
    assertCan(auth, "manage_fields");

    const existing = await prisma.fieldDefinition.findFirst({
      where: { id: fieldId, siteId: auth.siteId },
    });
    if (!existing) throw new NotFoundError("FieldDefinition", fieldId);

    // Cascade delete handles FieldValues via the Prisma schema
    await prisma.fieldDefinition.delete({ where: { id: fieldId } });
  },

  /** List field definitions for a content type */
  async listByContentType(
    siteId: string,
    contentTypeId: string,
  ): Promise<FieldDefinitionDto[]> {
    const fields = await prisma.fieldDefinition.findMany({
      where: {
        siteId,
        OR: [
          { contentTypeId },
          { contentTypeId: null }, // site-global fields also apply
        ],
      },
      orderBy: [{ group: "asc" }, { sortOrder: "asc" }],
    });
    return fields.map(toDto);
  },

  /** Bulk register fields (used by plugins during activation) */
  async registerBulk(
    auth: AuthContext,
    contentTypeSlug: string,
    fields: CreateFieldDefinitionInput[],
    source: string,
  ): Promise<FieldDefinitionDto[]> {
    assertCan(auth, "manage_fields");

    const ct = await prisma.contentType.findUnique({
      where: { siteId_slug: { siteId: auth.siteId, slug: contentTypeSlug } },
    });
    if (!ct) throw new NotFoundError("ContentType", contentTypeSlug);

    const results: FieldDefinitionDto[] = [];
    for (const field of fields) {
      const result = await this.create(
        auth,
        { ...field, contentTypeId: ct.id },
        source,
      );
      results.push(result);
    }
    return results;
  },
};

// ── Mapping ──

function toDto(fd: {
  id: string;
  siteId: string;
  contentTypeId: string | null;
  key: string;
  name: string;
  description: string | null;
  fieldType: string;
  isRequired: boolean;
  defaultValue: unknown;
  validation: unknown;
  options: unknown;
  group: string;
  sortOrder: number;
  source: string;
}): FieldDefinitionDto {
  return {
    id: fd.id,
    siteId: fd.siteId,
    contentTypeId: fd.contentTypeId,
    key: fd.key,
    name: fd.name,
    description: fd.description,
    fieldType: fd.fieldType as FieldDefinitionDto["fieldType"],
    isRequired: fd.isRequired,
    defaultValue: fd.defaultValue,
    validation: fd.validation as Record<string, unknown> | null,
    options: fd.options as Array<{ label: string; value: string }> | null,
    group: fd.group,
    sortOrder: fd.sortOrder,
    source: fd.source,
  };
}
