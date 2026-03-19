/**
 * Local filesystem storage provider.
 * Used in development. Files saved to public/uploads/.
 */

import { mkdir, writeFile, unlink, access } from "fs/promises";
import { join, dirname } from "path";
import type { StorageProvider } from "./storage-provider";
import type { StoredFile } from "./media-types";

export class LocalStorage implements StorageProvider {
  constructor(
    /** Absolute path to the uploads directory */
    private readonly basePath: string = join(process.cwd(), "public/uploads"),
    /** URL prefix for accessing files */
    private readonly urlPrefix: string = "/uploads",
  ) {}

  async put(key: string, data: Buffer, contentType: string): Promise<StoredFile> {
    const filePath = join(this.basePath, key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, data);
    return { key, url: this.getUrl(key) };
  }

  async delete(key: string): Promise<void> {
    try {
      await unlink(join(this.basePath, key));
    } catch {
      // File may not exist — that's fine
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await access(join(this.basePath, key));
      return true;
    } catch {
      return false;
    }
  }

  getUrl(key: string): string {
    return `${this.urlPrefix}/${key}`;
  }
}
