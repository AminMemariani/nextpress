import { describe, it, expect } from "vitest";
import {
  ALLOWED_MIME_TYPES,
  IMAGE_MIME_TYPES,
  MAX_FILE_SIZE,
  IMAGE_VARIANTS,
  uploadMediaSchema,
  updateMediaSchema,
  listMediaSchema,
} from "../../media/media-types";

describe("ALLOWED_MIME_TYPES", () => {
  it("includes common image types", () => {
    expect(ALLOWED_MIME_TYPES).toContain("image/jpeg");
    expect(ALLOWED_MIME_TYPES).toContain("image/png");
    expect(ALLOWED_MIME_TYPES).toContain("image/webp");
  });

  it("excludes SVG for security", () => {
    expect(ALLOWED_MIME_TYPES).not.toContain("image/svg+xml");
  });

  it("includes PDF", () => {
    expect(ALLOWED_MIME_TYPES).toContain("application/pdf");
  });

  it("includes video types", () => {
    expect(ALLOWED_MIME_TYPES).toContain("video/mp4");
  });

  it("includes audio types", () => {
    expect(ALLOWED_MIME_TYPES).toContain("audio/mpeg");
  });
});

describe("IMAGE_MIME_TYPES", () => {
  it("has 5 image types", () => {
    expect(IMAGE_MIME_TYPES).toHaveLength(5);
  });

  it("is a subset of ALLOWED_MIME_TYPES", () => {
    for (const mime of IMAGE_MIME_TYPES) {
      expect(ALLOWED_MIME_TYPES).toContain(mime);
    }
  });
});

describe("MAX_FILE_SIZE", () => {
  it("is 50MB", () => {
    expect(MAX_FILE_SIZE).toBe(50 * 1024 * 1024);
  });
});

describe("IMAGE_VARIANTS", () => {
  it("has thumbnail, small, medium, large, og", () => {
    expect(Object.keys(IMAGE_VARIANTS)).toEqual(["thumbnail", "small", "medium", "large", "og"]);
  });

  it("thumbnail is 150x150 cover", () => {
    expect(IMAGE_VARIANTS.thumbnail).toEqual({ width: 150, height: 150, fit: "cover" });
  });

  it("og is 1200x630 cover", () => {
    expect(IMAGE_VARIANTS.og).toEqual({ width: 1200, height: 630, fit: "cover" });
  });

  it("small, medium, large use inside fit", () => {
    expect(IMAGE_VARIANTS.small.fit).toBe("inside");
    expect(IMAGE_VARIANTS.medium.fit).toBe("inside");
    expect(IMAGE_VARIANTS.large.fit).toBe("inside");
  });
});

describe("uploadMediaSchema", () => {
  const validUpload = {
    filename: "photo.jpg",
    mimeType: "image/jpeg",
    size: 1024,
  };

  it("accepts valid upload", () => {
    expect(() => uploadMediaSchema.parse(validUpload)).not.toThrow();
  });

  it("rejects empty filename", () => {
    expect(() => uploadMediaSchema.parse({ ...validUpload, filename: "" })).toThrow();
  });

  it("rejects size > MAX_FILE_SIZE", () => {
    expect(() =>
      uploadMediaSchema.parse({ ...validUpload, size: MAX_FILE_SIZE + 1 }),
    ).toThrow();
  });

  it("rejects size = 0", () => {
    expect(() => uploadMediaSchema.parse({ ...validUpload, size: 0 })).toThrow();
  });

  it("rejects negative size", () => {
    expect(() => uploadMediaSchema.parse({ ...validUpload, size: -1 })).toThrow();
  });

  it("accepts optional alt, title, caption", () => {
    const result = uploadMediaSchema.parse({
      ...validUpload,
      alt: "A photo",
      title: "My Photo",
      caption: "Taken yesterday",
    });
    expect(result.alt).toBe("A photo");
    expect(result.title).toBe("My Photo");
  });
});

describe("updateMediaSchema", () => {
  it("accepts empty object", () => {
    expect(() => updateMediaSchema.parse({})).not.toThrow();
  });

  it("accepts nullable fields", () => {
    const result = updateMediaSchema.parse({ alt: null, title: null, caption: null });
    expect(result.alt).toBeNull();
  });

  it("accepts focalPoint", () => {
    const result = updateMediaSchema.parse({ focalPoint: { x: 0.5, y: 0.5 } });
    expect(result.focalPoint).toEqual({ x: 0.5, y: 0.5 });
  });

  it("rejects focalPoint x > 1", () => {
    expect(() =>
      updateMediaSchema.parse({ focalPoint: { x: 1.5, y: 0.5 } }),
    ).toThrow();
  });

  it("rejects focalPoint y < 0", () => {
    expect(() =>
      updateMediaSchema.parse({ focalPoint: { x: 0.5, y: -0.1 } }),
    ).toThrow();
  });
});

describe("listMediaSchema", () => {
  it("applies defaults", () => {
    const result = listMediaSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.perPage).toBe(20);
    expect(result.sortBy).toBe("createdAt");
    expect(result.sortOrder).toBe("desc");
  });

  it("accepts all sortBy values", () => {
    for (const sortBy of ["createdAt", "filename", "size"]) {
      expect(() => listMediaSchema.parse({ sortBy })).not.toThrow();
    }
  });

  it("rejects invalid sortBy", () => {
    expect(() => listMediaSchema.parse({ sortBy: "invalid" })).toThrow();
  });
});
