/**
 * Cron endpoint for scheduled publishing.
 *
 * Call this every minute via:
 *   - Vercel Cron: vercel.json → { "crons": [{ "path": "/api/cron/publish", "schedule": "* * * * *" }] }
 *   - Railway/Render: external cron service hitting this URL
 *   - System crontab: curl https://your-site.com/api/cron/publish
 *
 * Protected by CRON_SECRET — the request must include an Authorization
 * header matching the CRON_SECRET env var. Vercel sets this automatically.
 */

import { NextResponse } from "next/server";
import { scheduler } from "@nextpress/core/scheduling/scheduler";

/**
 * SECURITY: POST only (GET must be idempotent — publishing is not).
 * Always requires CRON_SECRET. Vercel sets this automatically for cron jobs.
 */
export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 403 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await scheduler.publishScheduledEntries();

  return NextResponse.json(result, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}

/** GET returns status only (for health checks) — does NOT publish */
export async function GET() {
  return NextResponse.json({ status: "ok", method: "Use POST to trigger publishing" });
}
