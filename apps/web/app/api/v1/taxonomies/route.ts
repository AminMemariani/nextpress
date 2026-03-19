/**
 * REST API: Taxonomies
 * GET /api/v1/taxonomies   List taxonomies + terms (public)
 */

import { jsonResponse, handleCmsError, handleOptions } from "@/lib/api/rest-helpers";
import { prisma } from "@nextpress/db";
import { headers } from "next/headers";
import { resolveSite } from "@/lib/site/resolve";

export async function GET() {
  try {
    const h = await headers();
    const site = await resolveSite(h);
    if (!site) return jsonResponse([]);

    const taxonomies = await prisma.taxonomy.findMany({
      where: { siteId: site.id, isPublic: true },
      include: {
        terms: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, name: true, slug: true, description: true, parentId: true },
        },
      },
    });

    return jsonResponse(taxonomies);
  } catch (e) { return handleCmsError(e); }
}

export function OPTIONS() { return handleOptions(); }
