import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("fs/promises", () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined),
  access: vi.fn().mockResolvedValue(undefined),
}));

const { LocalStorage } = await import("../../media/local-storage");

describe("LocalStorage", () => {
  let storage: InstanceType<typeof LocalStorage>;

  beforeEach(() => {
    storage = new LocalStorage("/tmp/uploads", "/uploads");
    vi.clearAllMocks();
  });

  describe("put", () => {
    it("writes file and returns key/url", async () => {
      const { mkdir, writeFile } = await import("fs/promises");
      const result = await storage.put("site/2025/01/file.jpg", Buffer.from("data"), "image/jpeg");
      expect(mkdir).toHaveBeenCalled();
      expect(writeFile).toHaveBeenCalled();
      expect(result.key).toBe("site/2025/01/file.jpg");
      expect(result.url).toBe("/uploads/site/2025/01/file.jpg");
    });
  });

  describe("delete", () => {
    it("unlinks the file", async () => {
      const { unlink } = await import("fs/promises");
      await storage.delete("site/file.jpg");
      expect(unlink).toHaveBeenCalledWith("/tmp/uploads/site/file.jpg");
    });

    it("does not throw when file not found", async () => {
      const { unlink } = await import("fs/promises");
      (unlink as any).mockRejectedValueOnce(new Error("ENOENT"));
      await expect(storage.delete("missing.jpg")).resolves.toBeUndefined();
    });
  });

  describe("exists", () => {
    it("returns true when file accessible", async () => {
      expect(await storage.exists("file.jpg")).toBe(true);
    });

    it("returns false when file not accessible", async () => {
      const { access } = await import("fs/promises");
      (access as any).mockRejectedValueOnce(new Error("ENOENT"));
      expect(await storage.exists("missing.jpg")).toBe(false);
    });
  });

  describe("getUrl", () => {
    it("builds URL from prefix and key", () => {
      expect(storage.getUrl("site/file.jpg")).toBe("/uploads/site/file.jpg");
    });
  });
});
