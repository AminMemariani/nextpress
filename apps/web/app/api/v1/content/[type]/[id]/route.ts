/**
 * REST API: Single content entry
 * GET    /api/v1/content/{type}/{id}   Get entry
 * PUT    /api/v1/content/{type}/{id}   Update entry
 * DELETE /api/v1/content/{type}/{id}   Delete entry
 */

import {
  jsonResponse, errorResponse, handleCmsError,
  handleOptions, requireRestAuth,
} from "@/lib/api/rest-helpers";
import { contentService } from "@nextpress/core/content/content-service";
import { headers } from "next/headers";
import { resolveSite } from "@/lib/site/resolve";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  try {
    const { id } = await params;
    const h = await headers();
    const site = await resolveSite(h);
    if (!site) return errorResponse("SITE_NOT_FOUND", "Site not found", 404);

    const entry = await contentService.getById(site.id, id);
    return jsonResponse(entry);
  } catch (e) {
    return handleCmsError(e);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await requireRestAuth();
    const body = await req.json();

    const entry = await contentService.update(auth, id, body);
    return jsonResponse(entry);
  } catch (e) {
    return handleCmsError(e);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ type: string; id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await requireRestAuth();
    await contentService.delete(auth, id);
    return jsonResponse({ deleted: true });
  } catch (e) {
    return handleCmsError(e);
  }
}

export function OPTIONS() { return handleOptions(); }
