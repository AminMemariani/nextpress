import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolveSite } from "@/lib/site/resolve";
import { themeManager } from "@nextpress/core/theme/theme-manager";
import { resolveTemplate } from "@nextpress/core/theme/template-resolver";
import { prisma } from "@nextpress/db";
import { buildEntryPageMetadata, buildTaxonomyPageMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/structured-data";
import { buildEntryStructuredData } from "@nextpress/core/seo/structured-data";
import { seoService } from "@nextpress/core/seo/seo-service";
import type { TemplateContext, TemplateEntry } from "@nextpress/core/theme/theme-types";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string[] }>;
}

// ── Content query select (shared between page and metadata) ──

const ENTRY_SELECT = {
  id: true, title: true, slug: true, excerpt: true, blocks: true,
  status: true, template: true, publishedAt: true, createdAt: true, updatedAt: true,
  contentType: { select: { id: true, slug: true, nameSingular: true, hierarchical: true } },
  author: { select: { id: true, name: true, displayName: true, image: true } },
  fieldValues: { select: { value: true, fieldDefinition: { select: { key: true } } } },
  terms: { select: { term: { select: { id: true, name: true, slug: true, taxonomy: { select: { slug: true, name: true } } } } } },
  mediaAttachments: {
    where: { role: "featured_image" as const }, take: 1,
    select: { mediaAsset: { select: { id: true, url: true, alt: true, width: true, height: true } } },
  },
  _count: { select: { revisions: true } },
} as const;

// ── Metadata generation ──

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: segments } = await params;
  const h = await headers();
  const site = await resolveSite(h);
  if (!site) return { title: "Not Found" };

  // Try content entry
  const entry = await prisma.contentEntry.findFirst({
    where: { siteId: site.id, slug: segments[segments.length - 1], status: "PUBLISHED" },
    select: ENTRY_SELECT,
  });

  if (entry) {
    const dto = toEntryDto(entry);
    return buildEntryPageMetadata(dto);
  }

  // Try taxonomy
  const term = await prisma.term.findFirst({
    where: { slug: segments[segments.length - 1], taxonomy: { siteId: site.id } },
    include: { taxonomy: true },
  });

  if (term) {
    return buildTaxonomyPageMetadata({
      name: term.name,
      slug: term.slug,
      taxonomy: term.taxonomy.slug,
    });
  }

  return { title: "Not Found" };
}

// ── Page component ──

export default async function CatchAllPage({ params }: Props) {
  const { slug: segments } = await params;
  const h = await headers();
  const site = await resolveSite(h);
  if (!site) notFound();

  const theme = await themeManager.getActive(site.id);
  const install = await prisma.themeInstall.findFirst({
    where: { siteId: site.id, isActive: true },
  });
  const customizations = (install?.customizations as Record<string, unknown>) ?? {};

  // Try content entry
  const entry = await prisma.contentEntry.findFirst({
    where: { siteId: site.id, slug: segments[segments.length - 1], status: "PUBLISHED" },
    select: ENTRY_SELECT,
  });

  if (entry) {
    const templateEntry = toTemplateEntry(entry);
    const dto = toEntryDto(entry);

    const context: TemplateContext = {
      entry: templateEntry,
      site: { name: site.name, tagline: site.tagline, url: site.domain ?? "" },
      customizations,
    };

    const { template: Template } = resolveTemplate(theme.templates, {
      pageType: "single",
      contentTypeSlug: entry.contentType.slug,
      entrySlug: entry.slug,
      entryTemplate: entry.template,
      isHierarchical: (entry.contentType as any).hierarchical,
    });

    // Build structured data
    const defaults = seoService.buildDefaults(site);
    const structuredData = buildEntryStructuredData(dto, defaults);

    return (
      <>
        <JsonLd data={structuredData} />
        <Template context={context} />
      </>
    );
  }

  // Try taxonomy archive
  const term = await prisma.term.findFirst({
    where: { slug: segments[segments.length - 1], taxonomy: { siteId: site.id } },
    include: { taxonomy: true },
  });

  if (term) {
    const entries = await prisma.contentEntry.findMany({
      where: { siteId: site.id, status: "PUBLISHED", terms: { some: { termId: term.id } } },
      orderBy: { publishedAt: "desc" },
      take: 20,
      select: ENTRY_SELECT,
    });

    const context: TemplateContext = {
      entry: null,
      entries: entries.map(toTemplateEntry),
      term: { name: term.name, slug: term.slug, taxonomy: term.taxonomy.slug },
      site: { name: site.name, tagline: site.tagline, url: site.domain ?? "" },
      customizations,
    };

    const { template: Template } = resolveTemplate(theme.templates, {
      pageType: "taxonomy",
      taxonomySlug: term.taxonomy.slug,
      termSlug: term.slug,
    });

    return <Template context={context} />;
  }

  notFound();
}

// ── Helpers ──

function toTemplateEntry(e: any): TemplateEntry {
  const fields: Record<string, unknown> = {};
  for (const fv of e.fieldValues ?? []) fields[fv.fieldDefinition.key] = fv.value;
  return {
    id: e.id, title: e.title, slug: e.slug, excerpt: e.excerpt,
    blocks: e.blocks as any, status: e.status, template: e.template,
    contentType: e.contentType, author: e.author,
    publishedAt: e.publishedAt, createdAt: e.createdAt, fields,
    terms: (e.terms ?? []).map((ct: any) => ({ name: ct.term.name, slug: ct.term.slug, taxonomy: ct.term.taxonomy })),
    featuredImage: e.mediaAttachments?.[0]?.mediaAsset ?? null,
  };
}

function toEntryDto(e: any): any {
  const fields: Record<string, unknown> = {};
  for (const fv of e.fieldValues ?? []) fields[fv.fieldDefinition.key] = fv.value;
  return {
    ...e,
    fields,
    terms: (e.terms ?? []).map((ct: any) => ({
      id: ct.term.id, name: ct.term.name, slug: ct.term.slug, taxonomy: ct.term.taxonomy,
    })),
    featuredImage: e.mediaAttachments?.[0]?.mediaAsset ?? null,
    revisionCount: e._count?.revisions ?? 0,
  };
}
