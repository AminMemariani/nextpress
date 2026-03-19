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

  // SECURITY: Always require a configured secret for the webhook source.
  // Without a secret, reject the webhook entirely.
  const secret = process.env[`WEBHOOK_SECRET_${source.toUpperCase()}`];
  if (!secret) {
    return NextResponse.json(
      { error: `No webhook secret configured for source "${source}"` },
      { status: 400 },
    );
  }

  // SECURITY: Require signature header
  if (!signature || !signature.startsWith("sha256=")) {
    return NextResponse.json({ error: "Missing or malformed signature" }, { status: 401 });
  }

  // SECURITY: Constant-time comparison to prevent timing attacks
  const expected = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  const sigBuffer = Buffer.from(signature);
  const expBuffer = Buffer.from(expected);
  if (sigBuffer.length !== expBuffer.length || !require("crypto").timingSafeEqual(sigBuffer, expBuffer)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  console.log(`[Webhook] Verified from ${source}:`, body.slice(0, 200));

  return NextResponse.json({ received: true }, { status: 200 });
}
