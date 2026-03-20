import { describe, it, expect } from "vitest";
import {
  PERMISSION_DEFINITIONS,
  BCRYPT_ROUNDS,
  SESSION_CONFIG,
  PUBLIC_ROUTES,
  PROTECTED_ROUTE_PREFIXES,
} from "../../auth/auth-config";

describe("PERMISSION_DEFINITIONS", () => {
  it("has 28 entries", () => {
    expect(PERMISSION_DEFINITIONS).toHaveLength(28);
  });

  it("has no duplicate slugs", () => {
    const slugs = PERMISSION_DEFINITIONS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every entry has slug, name, and group", () => {
    for (const perm of PERMISSION_DEFINITIONS) {
      expect(perm.slug).toBeTruthy();
      expect(perm.name).toBeTruthy();
      expect(perm.group).toBeTruthy();
    }
  });

  it("includes expected groups", () => {
    const groups = new Set(PERMISSION_DEFINITIONS.map((p) => p.group));
    expect(groups).toContain("content");
    expect(groups).toContain("media");
    expect(groups).toContain("users");
    expect(groups).toContain("settings");
    expect(groups).toContain("general");
  });

  it("includes baseline permissions read and edit_profile", () => {
    const slugs = PERMISSION_DEFINITIONS.map((p) => p.slug);
    expect(slugs).toContain("read");
    expect(slugs).toContain("edit_profile");
  });
});

describe("BCRYPT_ROUNDS", () => {
  it("is 12", () => {
    expect(BCRYPT_ROUNDS).toBe(12);
  });
});

describe("SESSION_CONFIG", () => {
  it("uses jwt strategy", () => {
    expect(SESSION_CONFIG.strategy).toBe("jwt");
  });

  it("has maxAge of 30 days in seconds", () => {
    expect(SESSION_CONFIG.maxAge).toBe(30 * 24 * 60 * 60);
  });

  it("has updateAge of 1 day in seconds", () => {
    expect(SESSION_CONFIG.updateAge).toBe(24 * 60 * 60);
  });
});

describe("PUBLIC_ROUTES", () => {
  it("includes /login and /register", () => {
    expect(PUBLIC_ROUTES).toContain("/login");
    expect(PUBLIC_ROUTES).toContain("/register");
  });

  it("includes root /", () => {
    expect(PUBLIC_ROUTES).toContain("/");
  });
});

describe("PROTECTED_ROUTE_PREFIXES", () => {
  it("includes /admin", () => {
    expect(PROTECTED_ROUTE_PREFIXES).toContain("/admin");
  });
});
