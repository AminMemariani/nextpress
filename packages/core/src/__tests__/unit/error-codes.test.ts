import { describe, it, expect } from "vitest";
import { ErrorCodes } from "../../errors/error-codes";

describe("ErrorCodes", () => {
  it("includes all expected codes", () => {
    expect(ErrorCodes.UNAUTHENTICATED).toBe("UNAUTHENTICATED");
    expect(ErrorCodes.FORBIDDEN).toBe("FORBIDDEN");
    expect(ErrorCodes.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    expect(ErrorCodes.NOT_FOUND).toBe("NOT_FOUND");
    expect(ErrorCodes.CONFLICT).toBe("CONFLICT");
    expect(ErrorCodes.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
    expect(ErrorCodes.RATE_LIMITED).toBe("RATE_LIMITED");
  });

  it("has no duplicate values", () => {
    const values = Object.values(ErrorCodes);
    expect(new Set(values).size).toBe(values.length);
  });

  it("has string values matching keys", () => {
    for (const [key, value] of Object.entries(ErrorCodes)) {
      expect(key).toBe(value);
    }
  });
});
