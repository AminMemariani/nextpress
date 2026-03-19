import { headers } from "next/headers";
import { resolveSite } from "@/lib/site/resolve";
import { prisma } from "@nextpress/db";

export async function GET() {
  const h = await headers();
  const site = await resolveSite(h);
  if (!site) return new Response("Site not found", { status: 404 });

  const siteUrl = site.domain ? `https://${site.domain}` : `https://${site.slug}.nextpress.app`;

  const entries = await prisma.contentEntry.findMany({
    where: { siteId: site.id, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 20,
    select: {
      title: true, slug: true, excerpt: true, publishedAt: true,
      contentType: { select: { slug: true } },
      author: { select: { name: true, displayName: true } },
    },
  });

  const items = entries.map((e) => {
    const url = `${siteUrl}/${e.slug}`;
    const author = e.author.displayName ?? e.author.name ?? "Unknown";
    return `    <item>
      <title><![CDATA[${e.title}]]></title>
      <link>${url.replace(/&/g,"&amp;")}</link>
      <guid isPermaLink="true">${url.replace(/&/g,"&amp;")}</guid>
      <pubDate>${e.publishedAt?.toUTCString() ?? ""}</pubDate>
      <dc:creator><![CDATA[${author}]]></dc:creator>
      ${e.excerpt ? `<description><![CDATA[${e.excerpt}]]></description>` : ""}
    </item>`;
  }).join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${site.name}]]></title>
    <link>${siteUrl}</link>
    <description><![CDATA[${site.tagline ?? ""}]]></description>
    <language>${site.locale ?? "en"}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
