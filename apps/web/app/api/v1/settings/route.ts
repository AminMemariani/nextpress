/**
 * REST API: Public settings
 * GET /api/v1/settings   Get public site settings
 */

import { jsonResponse, handleCmsError, handleOptions } from "@/lib/api/rest-helpers";
import { prisma } from "@nextpress/db";
import { headers } from "next/headers";
import { resolveSite } from "@/lib/site/resolve";

export async function GET() {
  try {
    const h = await headers();
    const site = await resolveSite(h);
    if (!site) return jsonResponse({});

    const settings = await prisma.setting.findMany({
      where: { siteId: site.id, group: { in: ["general", "reading"] } },
    });

    const result: Record<string, unknown> = {
      name: site.name,
      tagline: site.tagline,
      url: site.domain ?? `${site.slug}.nextpress.app`,
    };

    for (const s of settings) {
      result[`${s.group}.${s.key}`] = s.value;
    }

    return jsonResponse(result);
  } catch (e) { return handleCmsError(e); }
}

export function OPTIONS() { return handleOptions(); }
