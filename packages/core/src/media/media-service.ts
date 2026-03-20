/**
 * Media Service
 *
 * Handles file uploads, metadata management, variant generation,
 * and storage provider abstraction.
 *
 * Upload flow:
 *   1. Validate file (size, MIME type, filename)
 *   2. Store original via storage provider
 *   3. If image: extract dimensions, generate variants
 *   4. Create MediaAsset DB record with metadata + variant URLs
 *   5. Return MediaAssetDto
 *
 * Security:
 *   - MIME type validated against allowlist (not just extension)
 *   - File size capped at 50MB
 *   - Filenames sanitized (no path traversal)
 *   - SVGs blocked from image processing (XSS vector)
 *   - Storage keys include site scope (no cross-tenant access)
 */

import { prisma } from "@nextpress/db";
import { Prisma } from "@prisma/client";
import type { AuthContext } from "../auth/auth-types";
import { assertCan } from "../auth/permissions";
import { NotFoundError, ValidationError } from "../errors/cms-error";
import { toJsonInput, toNullableJsonInput } from "../prisma-helpers";
import { paginate, type PaginatedResult } from "../validation/schemas";
import type { StorageProvider } from "./storage-provider";
import { generateStorageKey } from "./storage-provider";
import { LocalStorage } from "./local-storage";
import { S3Storage } from "./s3-storage";
import {
  getImageMeta,
  generateVariants,
  isProcessableImage,
} from "./image-processor";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  uploadMediaSchema,
  updateMediaSchema,
  listMediaSchema,
  type UploadMediaInput,
  type UpdateMediaInput,
  type ListMediaInput,
  type MediaAssetDto,
} from "./media-types";

// ── Storage provider singleton ──

let storageInstance: StorageProvider | null = null;

function getStorage(): StorageProvider {
  if (storageInstance) return storageInstance;
  const provider = process.env.STORAGE_PROVIDER ?? "local";
  storageInstance = provider === "s3" ? new S3Storage() : new LocalStorage();
  return storageInstance;
}

// ── Service ──

export const mediaService = {
  /**
   * Upload a file and create a MediaAsset record.
   */
  async upload(
    auth: AuthContext,
    fileBuffer: Buffer,
    input: UploadMediaInput,
  ): Promise<MediaAssetDto> {
    assertCan(auth, "upload_media");
    const data = uploadMediaSchema.parse(input);

    // Validate MIME type
    if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(data.mimeType)) {
      throw new ValidationError(
        `File type "${data.mimeType}" is not allowed. Accepted: ${ALLOWED_MIME_TYPES.join(", ")}`,
      );
    }

    // Validate file size
    if (fileBuffer.length > MAX_FILE_SIZE) {
      throw new ValidationError(
        `File size ${(fileBuffer.length / 1024 / 1024).toFixed(1)}MB exceeds maximum ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    // Double-check buffer size matches declared size (prevent spoofing)
    if (Math.abs(fileBuffer.length - data.size) > 1024) {
      throw new ValidationError("Declared file size does not match actual file size");
    }

    const storage = getStorage();
    const key = generateStorageKey(auth.siteId, data.filename);

    // Store original file
    const stored = await storage.put(key, fileBuffer, data.mimeType);

    // Extract image metadata and generate variants
    let width: number | null = null;
    let height: number | null = null;
    let variants: Record<string, any> = {};
    let meta: Record<string, unknown> = {};

    if (isProcessableImage(data.mimeType)) {
      const imageMeta = await getImageMeta(fileBuffer);
      if (imageMeta) {
        width = imageMeta.width;
        height = imageMeta.height;
        meta.format = imageMeta.format;
      }

      // Generate variants (thumbnail, small, medium, large, og)
      variants = await generateVariants(fileBuffer, key, storage);
    }

    // Create DB record
    const asset = await prisma.mediaAsset.create({
      data: {
        siteId: auth.siteId,
        filename: data.filename,
        mimeType: data.mimeType,
        size: fileBuffer.length,
        width,
        height,
        url: stored.url,
        alt: data.alt ?? null,
        title: data.title ?? data.filename.replace(/\.[^.]+$/, ""),
        caption: data.caption ?? null,
        variants: toJsonInput(variants),
        meta: toJsonInput(meta),
        uploaderId: auth.user.id,
      },
      include: { uploader: { select: { id: true, name: true } } },
    });

    return toDto(asset);
  },

  /** Update media metadata (alt, title, caption, focal point) */
  async update(
    auth: AuthContext,
    mediaId: string,
    input: UpdateMediaInput,
  ): Promise<MediaAssetDto> {
    assertCan(auth, "upload_media");
    const data = updateMediaSchema.parse(input);

    const existing = await prisma.mediaAsset.findFirst({
      where: { id: mediaId, siteId: auth.siteId },
    });
    if (!existing) throw new NotFoundError("MediaAsset", mediaId);

    // If focal point changed and this is an image, regenerate cover variants
    let newVariants = existing.variants as Record<string, any>;
    if (data.focalPoint && isProcessableImage(existing.mimeType)) {
      const storage = getStorage();
      const key = extractKeyFromUrl(existing.url, storage);
      if (key && (await storage.exists(key))) {
        // Re-fetch original is complex; for now, store focal point for next regen
        // Full implementation would re-download and re-process
      }
    }

    const asset = await prisma.mediaAsset.update({
      where: { id: mediaId },
      data: {
        ...(data.alt !== undefined && { alt: data.alt }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.caption !== undefined && { caption: data.caption }),
        ...(data.focalPoint !== undefined && { focalPoint: toNullableJsonInput(data.focalPoint) }),
      },
      include: { uploader: { select: { id: true, name: true } } },
    });

    return toDto(asset);
  },

  /** Delete a media asset and its file from storage */
  async delete(auth: AuthContext, mediaId: string): Promise<void> {
    assertCan(auth, "delete_media");

    const asset = await prisma.mediaAsset.findFirst({
      where: { id: mediaId, siteId: auth.siteId },
    });
    if (!asset) throw new NotFoundError("MediaAsset", mediaId);

    const storage = getStorage();

    // Delete original file
    const key = extractKeyFromUrl(asset.url, storage);
    if (key) await storage.delete(key);

    // Delete variant files
    const variants = asset.variants as Record<string, { url?: string }>;
    for (const variant of Object.values(variants)) {
      if (variant?.url) {
        const vKey = extractKeyFromUrl(variant.url, storage);
        if (vKey) await storage.delete(vKey);
      }
    }

    // Delete DB record (cascades ContentMedia)
    await prisma.mediaAsset.delete({ where: { id: mediaId } });
  },

  /** Get a single media asset */
  async getById(siteId: string, mediaId: string): Promise<MediaAssetDto> {
    const asset = await prisma.mediaAsset.findFirst({
      where: { id: mediaId, siteId },
      include: { uploader: { select: { id: true, name: true } } },
    });
    if (!asset) throw new NotFoundError("MediaAsset", mediaId);
    return toDto(asset);
  },

  /** List media assets with filtering, search, and pagination */
  async list(
    siteId: string,
    input: ListMediaInput,
  ): Promise<PaginatedResult<MediaAssetDto>> {
    const parsed = listMediaSchema.parse(input);
    const skip = (parsed.page - 1) * parsed.perPage;

    const where: any = { siteId };
    if (parsed.mimeType) {
      if (parsed.mimeType === "image") {
        where.mimeType = { startsWith: "image/" };
      } else if (parsed.mimeType === "video") {
        where.mimeType = { startsWith: "video/" };
      } else if (parsed.mimeType === "audio") {
        where.mimeType = { startsWith: "audio/" };
      } else if (parsed.mimeType === "document") {
        where.mimeType = { startsWith: "application/" };
      } else {
        where.mimeType = parsed.mimeType;
      }
    }
    if (parsed.search) {
      where.OR = [
        { filename: { contains: parsed.search, mode: "insensitive" } },
        { title: { contains: parsed.search, mode: "insensitive" } },
        { alt: { contains: parsed.search, mode: "insensitive" } },
      ];
    }

    const orderBy: any = { [parsed.sortBy]: parsed.sortOrder };

    const [assets, total] = await Promise.all([
      prisma.mediaAsset.findMany({
        where,
        orderBy,
        skip,
        take: parsed.perPage,
        include: { uploader: { select: { id: true, name: true } } },
      }),
      prisma.mediaAsset.count({ where }),
    ]);

    return paginate(assets.map(toDto), total, parsed);
  },

  /** Get URL for a specific variant (falls back to original) */
  getVariantUrl(asset: MediaAssetDto, variant: string): string {
    return asset.variants[variant]?.url ?? asset.url;
  },

  /** Expose the storage provider for external use */
  getStorage,
};

// ── Helpers ──

function toDto(asset: any): MediaAssetDto {
  return {
    id: asset.id,
    siteId: asset.siteId,
    filename: asset.filename,
    mimeType: asset.mimeType,
    size: asset.size,
    width: asset.width,
    height: asset.height,
    duration: asset.duration,
    url: asset.url,
    alt: asset.alt,
    title: asset.title,
    caption: asset.caption,
    focalPoint: asset.focalPoint as MediaAssetDto["focalPoint"],
    variants: (asset.variants ?? {}) as Record<string, any>,
    meta: (asset.meta ?? {}) as Record<string, unknown>,
    uploader: asset.uploader,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
    isImage: asset.mimeType.startsWith("image/"),
  };
}

function extractKeyFromUrl(url: string, storage: StorageProvider): string | null {
  // For local: /uploads/site123/2025/03/file.jpg → site123/2025/03/file.jpg
  // For S3: https://bucket.s3.amazonaws.com/site123/... → site123/...
  if (url.startsWith("/uploads/")) return url.replace("/uploads/", "");
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/^\//, "");
  } catch {
    return url;
  }
}
