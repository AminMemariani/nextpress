import { prisma } from "@nextpress/db";
import type { AuthContext } from "../auth/auth-types";
import { assertCan } from "../auth/permissions";
import { NotFoundError, ValidationError } from "../errors/cms-error";
import { slugify, uniqueSlug } from "../validation/slug";
import {
  createTaxonomySchema,
  createTermSchema,
  updateTermSchema,
  type CreateTaxonomyInput,
  type CreateTermInput,
  type UpdateTermInput,
  type TaxonomyDto,
  type TermDto,
} from "./taxonomy-types";

export const taxonomyService = {
  // ── Taxonomies ──

  async create(auth: AuthContext, input: CreateTaxonomyInput): Promise<TaxonomyDto> {
    assertCan(auth, "manage_taxonomies");
    const data = createTaxonomySchema.parse(input);
    const taxonomy = await prisma.taxonomy.create({
      data: { siteId: auth.siteId, ...data, isSystem: false },
      include: { _count: { select: { terms: true } } },
    });
    return toTaxonomyDto(taxonomy);
  },

  async list(siteId: string): Promise<TaxonomyDto[]> {
    const taxonomies = await prisma.taxonomy.findMany({
      where: { siteId },
      orderBy: { slug: "asc" },
      include: { _count: { select: { terms: true } } },
    });
    return taxonomies.map(toTaxonomyDto);
  },

  async getBySlug(siteId: string, slug: string): Promise<TaxonomyDto> {
    const t = await prisma.taxonomy.findUnique({
      where: { siteId_slug: { siteId, slug } },
      include: { _count: { select: { terms: true } } },
    });
    if (!t) throw new NotFoundError("Taxonomy", slug);
    return toTaxonomyDto(t);
  },

  async delete(auth: AuthContext, taxonomyId: string): Promise<void> {
    assertCan(auth, "manage_taxonomies");
    const t = await prisma.taxonomy.findFirst({ where: { id: taxonomyId, siteId: auth.siteId } });
    if (!t) throw new NotFoundError("Taxonomy", taxonomyId);
    if (t.isSystem) throw new ValidationError("Cannot delete system taxonomies");
    await prisma.taxonomy.delete({ where: { id: taxonomyId } });
  },

  // ── Terms ──

  async createTerm(auth: AuthContext, input: CreateTermInput): Promise<TermDto> {
    assertCan(auth, "manage_categories");
    const data = createTermSchema.parse(input);
    const taxonomy = await prisma.taxonomy.findUnique({ where: { id: data.taxonomyId } });
    if (!taxonomy) throw new NotFoundError("Taxonomy", data.taxonomyId);

    const slug = await uniqueSlug(
      data.slug ?? slugify(data.name),
      async (candidate) => {
        const existing = await prisma.term.findUnique({
          where: { taxonomyId_slug: { taxonomyId: data.taxonomyId, slug: candidate } },
        });
        return !!existing;
      },
    );

    const term = await prisma.term.create({
      data: {
        taxonomyId: data.taxonomyId,
        name: data.name,
        slug,
        description: data.description ?? null,
        parentId: data.parentId ?? null,
        sortOrder: data.sortOrder,
      },
      include: { _count: { select: { contents: true } } },
    });
    return toTermDto(term);
  },

  async updateTerm(auth: AuthContext, termId: string, input: UpdateTermInput): Promise<TermDto> {
    assertCan(auth, "manage_categories");
    const data = updateTermSchema.parse(input);
    const term = await prisma.term.update({
      where: { id: termId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
      include: { _count: { select: { contents: true } } },
    });
    return toTermDto(term);
  },

  async deleteTerm(auth: AuthContext, termId: string): Promise<void> {
    assertCan(auth, "manage_categories");
    await prisma.term.delete({ where: { id: termId } });
  },

  async listTerms(taxonomyId: string): Promise<TermDto[]> {
    const terms = await prisma.term.findMany({
      where: { taxonomyId },
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { contents: true } } },
    });
    return buildTermTree(terms.map(toTermDto));
  },
};

function toTaxonomyDto(t: any): TaxonomyDto {
  return {
    id: t.id, siteId: t.siteId, slug: t.slug, name: t.name,
    description: t.description, hierarchical: t.hierarchical,
    isSystem: t.isSystem, isPublic: t.isPublic, contentTypes: t.contentTypes,
    termCount: t._count?.terms ?? 0,
  };
}

function toTermDto(t: any): TermDto {
  return {
    id: t.id, taxonomyId: t.taxonomyId, name: t.name, slug: t.slug,
    description: t.description, parentId: t.parentId, sortOrder: t.sortOrder,
    meta: (t.meta ?? {}) as Record<string, unknown>,
    children: [], contentCount: t._count?.contents ?? 0,
  };
}

function buildTermTree(terms: TermDto[]): TermDto[] {
  const map = new Map(terms.map((t) => [t.id, { ...t, children: [] as TermDto[] }]));
  const roots: TermDto[] = [];
  for (const t of terms) {
    const node = map.get(t.id)!;
    if (t.parentId && map.has(t.parentId)) map.get(t.parentId)!.children.push(node);
    else roots.push(node);
  }
  return roots;
}
