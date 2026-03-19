/**
 * REST API: Comments
 * GET  /api/v1/comments?entry_id=xxx   Get approved comments for an entry (public)
 * POST /api/v1/comments                Submit a comment (public, auth optional)
 */

import { jsonResponse, handleCmsError, handleOptions } from "@/lib/api/rest-helpers";
import { commentService } from "@nextpress/core/comment/comment-service";
import { getAuthContext } from "@/lib/auth/session";
import { headers } from "next/headers";
import { resolveSite } from "@/lib/site/resolve";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const entryId = url.searchParams.get("entry_id");
    if (!entryId) return jsonResponse([]);

    const comments = await commentService.getForEntry(entryId);
    return jsonResponse(comments);
  } catch (e) { return handleCmsError(e); }
}

export async function POST(req: Request) {
  try {
    const h = await headers();
    const site = await resolveSite(h);
    if (!site) return jsonResponse({ error: "Site not found" }, 404);

    const auth = await getAuthContext();
    const body = await req.json();
    const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    const userAgent = h.get("user-agent") ?? null;

    const comment = await commentService.submit(
      site.id, body, auth, { ip: ip ?? undefined, userAgent: userAgent ?? undefined },
    );

    return jsonResponse(comment, 201);
  } catch (e) { return handleCmsError(e); }
}

export function OPTIONS() { return handleOptions(); }
