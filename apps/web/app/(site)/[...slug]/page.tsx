import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { resolveSite } from "@/lib/site/resolve";
import { themeManager } from "@nextpress/core/theme/theme-manager";
import { resolveTemplate } from "@nextpress/core/theme/template-resolver";
import { getCachedEntry, getCachedTermWithEntries, getCachedThemeInstall } from "@/lib/cache/cached-queries";
import { buildEntryPageMetadata, buildTaxonomyPageMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/structured-data";
import { buildEntryStructuredData } from "@nextpress/core/seo/structured-data";
import { seoService } from "@nextpress/core/seo/seo-service";
import type { TemplateContext, TemplateEntry } from "@nextpress/core/theme/theme-types";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: segments } = await params;
  const h = await headers();
  const site = await resolveSite(h);
  if (!site) return { title: "Not Found" };

  const entrySlug = segments[segments.length - 1]!;

  // CACHED: try content entry
  const entry = await getCachedEntry(site.id, entrySlug);
  if (entry) {
    const dto = toEntryDto(entry);
    return buildEntryPageMetadata(dto);
  }

  // CACHED: try taxonomy term
  const termData = await getCachedTermWithEntries(site.id, entrySlug);
  if (termData) {
    return buildTaxonomyPageMetadata({
      name: termData.term.name,
      slug: termData.term.slug,
      taxonomy: termData.term.taxonomy.slug,
    });
  }

  return { title: "Not Found" };
}

export default async function CatchAllPage({ params }: Props) {
  const { slug: segments } = await params;
  const h = await headers();
  const site = await resolveSite(h);
  if (!site) notFound();

  const entrySlug = segments[segments.length - 1]!;
  const theme = await themeManager.getActive(site.id);
  const install = await getCachedThemeInstall(site.id);
  const customizations = (install?.customizations as Record<string, unknown>) ?? {};

  // CACHED: try content entry
  const entry = await getCachedEntry(site.id, entrySlug);

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

    const defaults = seoService.buildDefaults(site);
    const structuredData = buildEntryStructuredData(dto, defaults);

    return (
      <>
        <JsonLd data={structuredData} />
        <Template context={context} />
      </>
    );
  }

  // CACHED: try taxonomy archive
  const termData = await getCachedTermWithEntries(site.id, entrySlug);

  if (termData) {
    const context: TemplateContext = {
      entry: null,
      entries: termData.entries.map(toTemplateEntry),
      term: { name: termData.term.name, slug: termData.term.slug, taxonomy: termData.term.taxonomy.slug },
      site: { name: site.name, tagline: site.tagline, url: site.domain ?? "" },
      customizations,
    };

    const { template: Template } = resolveTemplate(theme.templates, {
      pageType: "taxonomy",
      taxonomySlug: termData.term.taxonomy.slug,
      termSlug: termData.term.slug,
    });

    return <Template context={context} />;
  }

  notFound();
}

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
    ...e, fields,
    terms: (e.terms ?? []).map((ct: any) => ({ id: ct.term.id, name: ct.term.name, slug: ct.term.slug, taxonomy: ct.term.taxonomy })),
    featuredImage: e.mediaAttachments?.[0]?.mediaAsset ?? null,
    revisionCount: e._count?.revisions ?? 0,
  };
}
