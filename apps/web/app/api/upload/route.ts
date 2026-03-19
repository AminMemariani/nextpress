/**
 * File upload endpoint.
 *
 * Accepts multipart/form-data with a single file field.
 * Validates, processes, and delegates to mediaService.
 *
 * This is a plain Next.js route handler (not tRPC) because tRPC
 * doesn't handle multipart form data natively. The upload endpoint
 * is the only non-tRPC mutation in the admin panel.
 */

import { NextResponse } from "next/server";
import { requireAuthContext } from "@/lib/auth/session";
import { mediaService } from "@nextpress/core/media/media-service";
import { MAX_FILE_SIZE } from "@nextpress/core/media/media-types";

export async function POST(req: Request) {
  try {
    const auth = await requireAuthContext();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const alt = formData.get("alt") as string | null;
    const title = formData.get("title") as string | null;

    const asset = await mediaService.upload(auth, buffer, {
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      alt: alt ?? undefined,
      title: title ?? undefined,
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (e: any) {
    const status = e.statusCode ?? 500;
    return NextResponse.json(
      { error: e.message ?? "Upload failed" },
      { status },
    );
  }
}
