import { headers } from "next/headers";
import { resolveSite } from "@/lib/site/resolve";
import { sitemapGenerator } from "@nextpress/core/seo/sitemap-generator";

export async function GET() {
  const h = await headers();
  const site = await resolveSite(h);
  if (!site) return new Response("Site not found", { status: 404 });

  const siteUrl = site.domain
    ? `https://${site.domain}`
    : `https://${site.slug}.nextpress.app`;

  const xml = await sitemapGenerator.generate(site.id, siteUrl);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
