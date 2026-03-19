/**
 * Image Processor — resize, crop, and generate variants.
 *
 * Uses sharp for image manipulation. Sharp is a native module that
 * handles JPEG, PNG, WebP, AVIF, and GIF efficiently.
 *
 * Variants are generated eagerly on upload (not on-demand) because:
 *   1. Predictable performance — no cold-start on first request
 *   2. CDN-friendly — all URLs are known at upload time
 *   3. Simpler architecture — no image proxy service needed
 */

import type { StorageProvider } from "./storage-provider";
import type { ImageVariant, VariantName } from "./media-types";
import { IMAGE_VARIANTS, IMAGE_MIME_TYPES } from "./media-types";

interface ImageMeta {
  width: number;
  height: number;
  format: string;
}

/**
 * Extract dimensions and format from an image buffer.
 */
export async function getImageMeta(buffer: Buffer): Promise<ImageMeta | null> {
  try {
    const sharp = (await import("sharp")).default;
    const meta = await sharp(buffer).metadata();
    if (!meta.width || !meta.height) return null;
    return {
      width: meta.width,
      height: meta.height,
      format: meta.format ?? "unknown",
    };
  } catch {
    return null;
  }
}

/**
 * Generate all configured variants for an image.
 * Returns a map of variant name → { url, width, height }.
 *
 * Each variant is stored via the storage provider under a modified key:
 *   original: site123/2025/03/abc-photo.jpg
 *   variant:  site123/2025/03/abc-photo-thumbnail.webp
 */
export async function generateVariants(
  buffer: Buffer,
  originalKey: string,
  storage: StorageProvider,
  focalPoint?: { x: number; y: number } | null,
): Promise<Record<string, ImageVariant>> {
  const sharp = (await import("sharp")).default;
  const variants: Record<string, ImageVariant> = {};
  const meta = await getImageMeta(buffer);
  if (!meta) return variants;

  const baseName = originalKey.replace(/\.[^.]+$/, "");

  for (const [name, config] of Object.entries(IMAGE_VARIANTS)) {
    // Skip variants larger than the original
    if (config.width >= meta.width && config.height >= meta.height) {
      continue;
    }

    try {
      let pipeline = sharp(buffer);

      if (config.fit === "cover" && focalPoint) {
        // Use focal point for cover crops
        pipeline = pipeline.resize(config.width, config.height, {
          fit: "cover",
          position: `${Math.round(focalPoint.x * 100)}% ${Math.round(focalPoint.y * 100)}%`,
        });
      } else {
        pipeline = pipeline.resize(config.width, config.height, {
          fit: config.fit,
          withoutEnlargement: true,
        });
      }

      // Convert to WebP for smaller file sizes
      const variantBuffer = await pipeline.webp({ quality: 80 }).toBuffer();
      const variantMeta = await sharp(variantBuffer).metadata();

      const variantKey = `${baseName}-${name}.webp`;
      const stored = await storage.put(variantKey, variantBuffer, "image/webp");

      variants[name] = {
        url: stored.url,
        width: variantMeta.width ?? config.width,
        height: variantMeta.height ?? config.height,
      };
    } catch (e) {
      console.warn(`[Media] Failed to generate ${name} variant for ${originalKey}:`, e);
    }
  }

  return variants;
}

/**
 * Check if a MIME type is a processable image.
 */
export function isProcessableImage(mimeType: string): boolean {
  return (IMAGE_MIME_TYPES as readonly string[]).includes(mimeType);
}
