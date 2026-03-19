import { z } from "zod";
import { paginationSchema, sortOrderSchema } from "../validation/schemas";

// ── Upload constraints ──

export const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/avif", "image/svg+xml",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  // Audio
  "audio/mpeg", "audio/ogg", "audio/wav", "audio/webm",
  // Video
  "video/mp4", "video/webm", "video/ogg",
  // Archives
  "application/zip",
] as const;

export const IMAGE_MIME_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/avif",
] as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/** Predefined image variant sizes */
export const IMAGE_VARIANTS = {
  thumbnail: { width: 150, height: 150, fit: "cover" as const },
  small:     { width: 300, height: 300, fit: "inside" as const },
  medium:    { width: 768, height: 768, fit: "inside" as const },
  large:     { width: 1200, height: 1200, fit: "inside" as const },
  og:        { width: 1200, height: 630, fit: "cover" as const },
} as const;

export type VariantName = keyof typeof IMAGE_VARIANTS;

export interface ImageVariant {
  url: string;
  width: number;
  height: number;
}

// ── Input schemas ──

export const uploadMediaSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string(),
  size: z.number().int().positive().max(MAX_FILE_SIZE),
  alt: z.string().max(500).optional(),
  title: z.string().max(500).optional(),
  caption: z.string().max(2000).optional(),
});

export type UploadMediaInput = z.infer<typeof uploadMediaSchema>;

export const updateMediaSchema = z.object({
  alt: z.string().max(500).optional().nullable(),
  title: z.string().max(500).optional().nullable(),
  caption: z.string().max(2000).optional().nullable(),
  focalPoint: z.object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
  }).optional().nullable(),
});

export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;

export const listMediaSchema = paginationSchema.extend({
  mimeType: z.string().optional(),
  search: z.string().max(200).optional(),
  sortBy: z.enum(["createdAt", "filename", "size"]).default("createdAt"),
  sortOrder: sortOrderSchema,
});

export type ListMediaInput = z.infer<typeof listMediaSchema>;

// ── Output DTO ──

export interface MediaAssetDto {
  id: string;
  siteId: string;
  filename: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  url: string;
  alt: string | null;
  title: string | null;
  caption: string | null;
  focalPoint: { x: number; y: number } | null;
  variants: Record<string, ImageVariant>;
  meta: Record<string, unknown>;
  uploader: { id: string; name: string | null };
  createdAt: Date;
  updatedAt: Date;
  isImage: boolean;
}

// ── Storage provider interface ──

export interface StoredFile {
  /** Storage key/path where the file was saved */
  key: string;
  /** Public URL to access the file */
  url: string;
}
