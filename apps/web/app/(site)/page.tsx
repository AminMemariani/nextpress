import { headers } from "next/headers";
import { resolveSite } from "@/lib/site/resolve";
import { themeManager } from "@nextpress/core/theme/theme-manager";
import { resolveTemplate } from "@nextpress/core/theme/template-resolver";
import { prisma } from "@nextpress/db";
import { buildHomePageMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/structured-data";
import { buildSiteStructuredData } from "@nextpress/core/seo/structured-data";
import { seoService } from "@nextpress/core/seo/seo-service";
import type { TemplateContext, TemplateEntry } from "@nextpress/core/theme/theme-types";
import type { Metadata } from "next";

// ── Metadata ──

export async function generateMetadata(): Promise<Metadata> {
  return buildHomePageMetadata();
}

// ── Page ──

export default async function HomePage() {
  const h = await headers();
  const site = await resolveSite(h);
  if (!site) return <div>Site not found</div>;

  const theme = await themeManager.getActive(site.id);

  const entries = await prisma.contentEntry.findMany({
    where: { siteId: site.id, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 10,
    select: {
      id: true, title: true, slug: true, excerpt: true, blocks: true,
      status: true, template: true, publishedAt: true, createdAt: true,
      contentType: { select: { slug: true, nameSingular: true } },
      author: { select: { name: true, displayName: true, image: true } },
      fieldValues: { select: { value: true, fieldDefinition: { select: { key: true } } } },
      terms: { select: { term: { select: { name: true, slug: true, taxonomy: { select: { slug: true } } } } } },
      mediaAttachments: {
        where: { role: "featured_image" }, take: 1,
        select: { mediaAsset: { select: { url: true, alt: true, width: true, height: true } } },
      },
    },
  });

  const install = await prisma.themeInstall.findFirst({
    where: { siteId: site.id, isActive: true },
  });

  const context: TemplateContext = {
    entry: null,
    entries: entries.map(toTemplateEntry),
    site: { name: site.name, tagline: site.tagline, url: site.domain ?? `${site.slug}.nextpress.app` },
    customizations: (install?.customizations as Record<string, unknown>) ?? {},
  };

  const { template: Template } = resolveTemplate(theme.templates, { pageType: "home" });
  const defaults = seoService.buildDefaults(site);
  const structuredData = buildSiteStructuredData(defaults);

  return (
    <>
      <JsonLd data={structuredData} />
      <Template context={context} />
    </>
  );
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
