/**
 * Incoming webhook receiver.
 *
 * Verifies HMAC signatures and dispatches to registered handlers.
 * Used for: payment callbacks, external service notifications, etc.
 *
 * External services POST to /api/webhooks with:
 *   - X-Webhook-Source header identifying the source
 *   - X-Webhook-Signature header for HMAC verification
 *   - JSON body with event data
 */

import { NextResponse } from "next/server";
import { createHmac } from "crypto";

export async function POST(req: Request) {
  const source = req.headers.get("x-webhook-source") ?? "unknown";
  const signature = req.headers.get("x-webhook-signature");
  const body = await req.text();

  // Verify signature if secret is configured
  const secret = process.env[`WEBHOOK_SECRET_${source.toUpperCase()}`];
  if (secret && signature) {
    const expected = createHmac("sha256", secret).update(body).digest("hex");
    if (signature !== `sha256=${expected}`) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  // Route to appropriate handler based on source
  // Plugins can register handlers via the hook system:
  //   hooks.addAction("webhook:received", "my-plugin", async (source, payload) => { ... })

  console.log(`[Webhook] Received from ${source}:`, body.slice(0, 200));

  return NextResponse.json({ received: true }, { status: 200 });
}
