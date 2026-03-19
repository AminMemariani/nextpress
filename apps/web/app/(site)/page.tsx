import { headers } from "next/headers";
import { resolveSite } from "@/lib/site/resolve";
import { themeManager } from "@nextpress/core/theme/theme-manager";
import { resolveTemplate } from "@nextpress/core/theme/template-resolver";
import { getCachedEntryList, getCachedThemeInstall } from "@/lib/cache/cached-queries";
import { buildHomePageMetadata } from "@/lib/seo/metadata";
import { JsonLd } from "@/lib/seo/structured-data";
import { buildSiteStructuredData } from "@nextpress/core/seo/structured-data";
import { seoService } from "@nextpress/core/seo/seo-service";
import type { TemplateContext, TemplateEntry } from "@nextpress/core/theme/theme-types";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return buildHomePageMetadata();
}

export default async function HomePage() {
  const h = await headers();
  const site = await resolveSite(h);
  if (!site) return <div>Site not found</div>;

  const theme = await themeManager.getActive(site.id);

  // CACHED: entries and theme install
  const [entries, install] = await Promise.all([
    getCachedEntryList(site.id, { limit: 10 }),
    getCachedThemeInstall(site.id),
  ]);

  const context: TemplateContext = {
    entry: null,
    entries: (entries ?? []).map(toTemplateEntry),
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
