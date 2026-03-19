/**
 * OG Image generation.
 *
 * Generates Open Graph images on-demand using Next.js ImageResponse.
 * Used as a fallback when no featured image is set on a content entry.
 *
 * Route: /api/og?title=Hello+World&siteName=My+Blog
 */

import { ImageResponse } from "next/og";

export function generateOgImage(
  title: string,
  siteName: string,
): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#0f172a",
          color: "white",
          padding: "60px",
        }}
      >
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            textAlign: "center",
            lineHeight: 1.2,
            maxWidth: "900px",
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#94a3b8",
            marginTop: 24,
          }}
        >
          {siteName}
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
