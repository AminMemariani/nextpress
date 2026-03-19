/**
 * On-demand ISR revalidation endpoint.
 *
 * Called by:
 *   - Content service after publish/update (via webhook or direct)
 *   - External services that need to bust the cache
 *
 * Query params:
 *   - tag: cache tag to revalidate (e.g., "content:abc123")
 *   - secret: matches REVALIDATION_SECRET env var
 */

import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

export async function POST(req: Request) {
  // SECURITY: Always require the secret. If unset, endpoint is disabled.
  const revalidationSecret = process.env.REVALIDATION_SECRET;
  if (!revalidationSecret) {
    return NextResponse.json({ error: "Revalidation not configured" }, { status: 403 });
  }

  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${revalidationSecret}`) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const tag = (body as any).tag ?? new URL(req.url).searchParams.get("tag");

  if (!tag || typeof tag !== "string") {
    return NextResponse.json({ error: "Missing tag parameter" }, { status: 400 });
  }

  revalidateTag(tag);
  return NextResponse.json({ revalidated: true, tag }, { status: 200 });
}
