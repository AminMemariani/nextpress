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

export async function GET(req: Request) {
  // Verify cron secret (prevents unauthorized invocations)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await scheduler.publishScheduledEntries();

  return NextResponse.json(result, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
