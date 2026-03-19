/**
 * REST API: Search
 * GET /api/v1/search?q=hello&type=post&page=1&per_page=10
 */

import { paginatedResponse, handleCmsError, handleOptions, parsePagination } from "@/lib/api/rest-helpers";
import { searchService } from "@nextpress/core/search/search-service";
import { headers } from "next/headers";
import { resolveSite } from "@/lib/site/resolve";

export async function GET(req: Request) {
  try {
    const h = await headers();
    const site = await resolveSite(h);
    if (!site) return paginatedResponse([], { page: 1, perPage: 20, total: 0, totalPages: 0 });

    const url = new URL(req.url);
    const query = url.searchParams.get("q") ?? "";
    if (!query) return paginatedResponse([], { page: 1, perPage: 20, total: 0, totalPages: 0 });

    const pagination = parsePagination(url);
    const result = await searchService.search(site.id, {
      query,
      status: "PUBLISHED",
      contentTypeSlug: url.searchParams.get("type") ?? undefined,
      ...pagination,
    });

    return paginatedResponse(result.results, {
      page: result.page,
      perPage: result.perPage,
      total: result.total,
      totalPages: result.totalPages,
    });
  } catch (e) {
    return handleCmsError(e);
  }
}

export function OPTIONS() { return handleOptions(); }
