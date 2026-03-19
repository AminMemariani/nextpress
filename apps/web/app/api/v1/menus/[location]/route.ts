/**
 * REST API: Menu by location
 * GET /api/v1/menus/{location}   Get menu for a theme location (public)
 */

import { jsonResponse, errorResponse, handleCmsError, handleOptions } from "@/lib/api/rest-helpers";
import { prisma } from "@nextpress/db";
import { headers } from "next/headers";
import { resolveSite } from "@/lib/site/resolve";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ location: string }> },
) {
  try {
    const { location } = await params;
    const h = await headers();
    const site = await resolveSite(h);
    if (!site) return errorResponse("SITE_NOT_FOUND", "Site not found", 404);

    const menu = await prisma.menu.findUnique({
      where: { siteId_location: { siteId: site.id, location } },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          select: {
            id: true, label: true, url: true, target: true,
            type: true, objectId: true, parentId: true,
            sortOrder: true, cssClass: true, openInNewTab: true,
          },
        },
      },
    });

    if (!menu) return errorResponse("NOT_FOUND", `Menu "${location}" not found`, 404);
    return jsonResponse(menu);
  } catch (e) { return handleCmsError(e); }
}

export function OPTIONS() { return handleOptions(); }
