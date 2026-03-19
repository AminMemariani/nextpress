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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tag = url.searchParams.get("tag");
  const secret = url.searchParams.get("secret");

  if (process.env.REVALIDATION_SECRET && secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  if (!tag) {
    return NextResponse.json({ error: "Missing tag parameter" }, { status: 400 });
  }

  revalidateTag(tag);
  return NextResponse.json({ revalidated: true, tag }, { status: 200 });
}
