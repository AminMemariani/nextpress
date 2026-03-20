import { describe, it, expect } from "vitest";
import {
  CmsError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
} from "../../errors/cms-error";

describe("CmsError", () => {
  it("sets message, code, statusCode", () => {
    const err = new CmsError("boom", "SOME_CODE", 503);
    expect(err.message).toBe("boom");
    expect(err.code).toBe("SOME_CODE");
    expect(err.statusCode).toBe(503);
    expect(err.name).toBe("CmsError");
  });

  it("defaults statusCode to 500", () => {
    const err = new CmsError("fail", "ERR");
    expect(err.statusCode).toBe(500);
  });

  it("carries optional details", () => {
    const details = { field: "title" };
    const err = new CmsError("bad", "ERR", 400, details);
    expect(err.details).toEqual(details);
  });

  it("is instanceof Error", () => {
    expect(new CmsError("x", "X")).toBeInstanceOf(Error);
  });
});

describe("AuthenticationError", () => {
  it("uses default message", () => {
    const err = new AuthenticationError();
    expect(err.message).toBe("Not authenticated");
    expect(err.code).toBe("UNAUTHENTICATED");
    expect(err.statusCode).toBe(401);
    expect(err.name).toBe("AuthenticationError");
  });

  it("accepts custom message", () => {
    const err = new AuthenticationError("Token expired");
    expect(err.message).toBe("Token expired");
  });

  it("is instanceof CmsError", () => {
    expect(new AuthenticationError()).toBeInstanceOf(CmsError);
  });
});

describe("AuthorizationError", () => {
  it("uses default message", () => {
    const err = new AuthorizationError();
    expect(err.message).toBe("Insufficient permissions");
    expect(err.code).toBe("FORBIDDEN");
    expect(err.statusCode).toBe(403);
    expect(err.name).toBe("AuthorizationError");
  });

  it("accepts custom message and details", () => {
    const err = new AuthorizationError("No access", { permission: "edit" });
    expect(err.message).toBe("No access");
    expect(err.details).toEqual({ permission: "edit" });
  });

  it("is instanceof CmsError", () => {
    expect(new AuthorizationError()).toBeInstanceOf(CmsError);
  });
});

describe("NotFoundError", () => {
  it("builds message with resource only", () => {
    const err = new NotFoundError("User");
    expect(err.message).toBe("User not found");
    expect(err.code).toBe("NOT_FOUND");
    expect(err.statusCode).toBe(404);
    expect(err.name).toBe("NotFoundError");
  });

  it("builds message with resource and id", () => {
    const err = new NotFoundError("Post", "abc123");
    expect(err.message).toBe("Post not found: abc123");
  });

  it("is instanceof CmsError", () => {
    expect(new NotFoundError("X")).toBeInstanceOf(CmsError);
  });
});

describe("ValidationError", () => {
  it("sets message and 400 status", () => {
    const err = new ValidationError("Invalid input");
    expect(err.message).toBe("Invalid input");
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.statusCode).toBe(400);
    expect(err.name).toBe("ValidationError");
  });

  it("carries details", () => {
    const err = new ValidationError("Bad field", { field: "email" });
    expect(err.details).toEqual({ field: "email" });
  });

  it("is instanceof CmsError", () => {
    expect(new ValidationError("x")).toBeInstanceOf(CmsError);
  });
});
