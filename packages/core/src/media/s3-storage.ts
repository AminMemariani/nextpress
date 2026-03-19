/**
 * S3-compatible storage provider.
 * Works with AWS S3, Cloudflare R2, MinIO, DigitalOcean Spaces.
 *
 * Requires: @aws-sdk/client-s3 (peer dependency, installed when needed)
 *
 * Environment variables:
 *   S3_BUCKET, S3_REGION, S3_ENDPOINT (optional, for R2/MinIO),
 *   S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY,
 *   S3_PUBLIC_URL (CDN URL prefix)
 */

import type { StorageProvider } from "./storage-provider";
import type { StoredFile } from "./media-types";

export class S3Storage implements StorageProvider {
  private client: any;
  private bucket: string;
  private publicUrl: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET ?? "nextpress-media";
    this.publicUrl = process.env.S3_PUBLIC_URL ?? `https://${this.bucket}.s3.amazonaws.com`;
  }

  private async getClient() {
    if (this.client) return this.client;

    // Dynamic import — @aws-sdk/client-s3 is only loaded when S3 storage is used
    const { S3Client } = await import("@aws-sdk/client-s3");
    this.client = new S3Client({
      region: process.env.S3_REGION ?? "us-east-1",
      ...(process.env.S3_ENDPOINT && { endpoint: process.env.S3_ENDPOINT }),
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
      },
    });
    return this.client;
  }

  async put(key: string, data: Buffer, contentType: string): Promise<StoredFile> {
    const client = await this.getClient();
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");

    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    return { key, url: this.getUrl(key) };
  }

  async delete(key: string): Promise<void> {
    const client = await this.getClient();
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");

    await client.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  async exists(key: string): Promise<boolean> {
    const client = await this.getClient();
    const { HeadObjectCommand } = await import("@aws-sdk/client-s3");

    try {
      await client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }

  getUrl(key: string): string {
    return `${this.publicUrl}/${key}`;
  }
}
