/**
 * REST API: Content entries by type
 * GET  /api/v1/content/{type}     List published entries (public)
 * POST /api/v1/content/{type}     Create entry (authenticated)
 */

import {
  jsonResponse, paginatedResponse, errorResponse, handleCmsError,
  handleOptions, requireRestAuth, parsePagination, parseSort,
} from "@/lib/api/rest-helpers";
import { contentService } from "@nextpress/core/content/content-service";
import { headers } from "next/headers";
import { resolveSite } from "@/lib/site/resolve";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  try {
    const { type } = await params;
    const url = new URL(req.url);
    const h = await headers();
    const site = await resolveSite(h);
    if (!site) return errorResponse("SITE_NOT_FOUND", "Site not found", 404);

    const pagination = parsePagination(url);
    const { sortBy, sortOrder } = parseSort(url, ["publishedAt", "createdAt", "title"]);

    const result = await contentService.list(site.id, {
      contentTypeSlug: type,
      status: "PUBLISHED",
      page: pagination.page,
      perPage: pagination.perPage,
      search: url.searchParams.get("search") ?? undefined,
      sortBy: sortBy as any,
      sortOrder,
    });

    return paginatedResponse(result.items, {
      page: result.page,
      perPage: result.perPage,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (e) {
    return handleCmsError(e);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  try {
    const { type } = await params;
    const auth = await requireRestAuth();
    const body = await req.json();

    const entry = await contentService.create(auth, {
      contentTypeSlug: type,
      ...body,
    });

    return jsonResponse(entry, 201);
  } catch (e) {
    return handleCmsError(e);
  }
}

export function OPTIONS() { return handleOptions(); }
