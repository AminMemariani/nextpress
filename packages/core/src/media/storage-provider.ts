/**
 * Storage Provider — Abstract interface for file storage.
 *
 * Implementations:
 *   - LocalStorage: saves to disk (development)
 *   - S3Storage: saves to S3/R2/MinIO (production)
 *
 * The media service calls these methods. The provider is selected
 * based on environment configuration (STORAGE_PROVIDER env var).
 */

import type { StoredFile } from "./media-types";

export interface StorageProvider {
  /** Save a file. Returns the storage key and public URL. */
  put(key: string, data: Buffer, contentType: string): Promise<StoredFile>;

  /** Delete a file by key. */
  delete(key: string): Promise<void>;

  /** Check if a file exists. */
  exists(key: string): Promise<boolean>;

  /** Get the public URL for a stored file key. */
  getUrl(key: string): string;
}

/**
 * Generate a storage key for an uploaded file.
 *
 * Format: {siteId}/{year}/{month}/{filename}
 * This prevents flat directory listing and organizes by time.
 */
export function generateStorageKey(
  siteId: string,
  filename: string,
): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  // Sanitize filename: remove special chars, limit length
  const safe = filename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 200);

  // Add timestamp to prevent collisions
  const ts = Date.now().toString(36);

  return `${siteId}/${year}/${month}/${ts}-${safe}`;
}
