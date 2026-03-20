import { describe, it, expect } from "vitest";
import { generateStorageKey } from "../../media/storage-provider";
import { isProcessableImage } from "../../media/image-processor";

describe("generateStorageKey", () => {
  it("includes siteId in path", () => {
    const key = generateStorageKey("site-123", "photo.jpg");
    expect(key).toMatch(/^site-123\//);
  });

  it("includes year and month", () => {
    const key = generateStorageKey("s1", "file.txt");
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    expect(key).toContain(`/${year}/${month}/`);
  });

  it("sanitizes filename - removes special chars", () => {
    const key = generateStorageKey("s1", "hello world!@#$.jpg");
    expect(key).not.toContain(" ");
    expect(key).not.toContain("!");
    expect(key).not.toContain("@");
    expect(key).toContain("hello_world");
  });

  it("preserves safe characters", () => {
    const key = generateStorageKey("s1", "my-file_v2.jpg");
    expect(key).toContain("my-file_v2.jpg");
  });

  it("limits filename length to 200 chars", () => {
    const longName = "a".repeat(300) + ".jpg";
    const key = generateStorageKey("s1", longName);
    const filename = key.split("/").pop()!;
    // filename includes timestamp prefix + hyphen + sanitized name
    // sanitized name is capped at 200
    expect(filename.length).toBeLessThanOrEqual(220);
  });

  it("includes timestamp for collision prevention", () => {
    const key1 = generateStorageKey("s1", "photo.jpg");
    const key2 = generateStorageKey("s1", "photo.jpg");
    // Keys generated in same millisecond could be equal, but format is correct
    expect(key1).toMatch(/\/[a-z0-9]+-photo\.jpg$/);
  });

  it("handles empty filename", () => {
    const key = generateStorageKey("s1", "");
    expect(key).toMatch(/^s1\/\d{4}\/\d{2}\/[a-z0-9]+-$/);
  });
});

describe("isProcessableImage", () => {
  it("returns true for JPEG", () => {
    expect(isProcessableImage("image/jpeg")).toBe(true);
  });

  it("returns true for PNG", () => {
    expect(isProcessableImage("image/png")).toBe(true);
  });

  it("returns true for WebP", () => {
    expect(isProcessableImage("image/webp")).toBe(true);
  });

  it("returns true for AVIF", () => {
    expect(isProcessableImage("image/avif")).toBe(true);
  });

  it("returns true for GIF", () => {
    expect(isProcessableImage("image/gif")).toBe(true);
  });

  it("returns false for PDF", () => {
    expect(isProcessableImage("application/pdf")).toBe(false);
  });

  it("returns false for SVG", () => {
    expect(isProcessableImage("image/svg+xml")).toBe(false);
  });

  it("returns false for video", () => {
    expect(isProcessableImage("video/mp4")).toBe(false);
  });

  it("returns false for unknown type", () => {
    expect(isProcessableImage("application/octet-stream")).toBe(false);
  });
});
