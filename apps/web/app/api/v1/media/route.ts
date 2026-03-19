/**
 * REST API: Media assets
 * GET /api/v1/media   List media (authenticated)
 */

import {
  paginatedResponse, handleCmsError, handleOptions,
  requireRestAuth, parsePagination,
} from "@/lib/api/rest-helpers";
import { mediaService } from "@nextpress/core/media/media-service";

export async function GET(req: Request) {
  try {
    const auth = await requireRestAuth();
    const url = new URL(req.url);
    const pagination = parsePagination(url);

    const result = await mediaService.list(auth.siteId, {
      ...pagination,
      mimeType: url.searchParams.get("type") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
    });

    return paginatedResponse(result.items, {
      page: result.page, perPage: result.perPage,
      total: result.total, totalPages: result.totalPages,
    });
  } catch (e) { return handleCmsError(e); }
}

export function OPTIONS() { return handleOptions(); }
