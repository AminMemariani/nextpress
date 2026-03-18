import "server-only";

import { prisma } from "@nextpress/db";
import { cache } from "react";

/**
 * Resolve the current Site from the request.
 *
 * Resolution order:
 *   1. X-Site-ID header (API consumers, testing)
 *   2. Custom domain lookup (www.example.com → site row)
 *   3. Subdomain extraction (mysite.nextpress.app → slug "mysite")
 *   4. Default site (single-tenant fallback)
 *
 * Uses React `cache()` so multiple calls in the same request return
 * the same result without re-querying the DB.
 */
export const resolveSite = cache(async (headers: Headers) => {
  // 1. Explicit header
  const headerSiteId = headers.get("x-site-id");
  if (headerSiteId) {
    const site = await prisma.site.findUnique({
      where: { id: headerSiteId, isActive: true },
    });
    if (site) return site;
  }

  // 2. Custom domain
  const host = headers.get("host") ?? "";
  const domain = host.split(":")[0]; // Strip port

  if (domain && !domain.endsWith(".nextpress.app") && domain !== "localhost") {
    const site = await prisma.site.findUnique({
      where: { domain, isActive: true },
    });
    if (site) return site;
  }

  // 3. Subdomain
  if (domain.endsWith(".nextpress.app")) {
    const slug = domain.replace(".nextpress.app", "");
    if (slug && slug !== "www") {
      const site = await prisma.site.findUnique({
        where: { slug, isActive: true },
      });
      if (site) return site;
    }
  }

  // 4. Default site
  const defaultSite = await prisma.site.findUnique({
    where: { slug: "default", isActive: true },
  });

  return defaultSite;
});

/**
 * Get the site ID from request headers.
 * Throws if no site could be resolved.
 */
export async function requireSite(headers: Headers) {
  const site = await resolveSite(headers);
  if (!site) {
    throw new Error("Could not resolve site from request");
  }
  return site;
}
