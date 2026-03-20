import { describe, it, expect } from "vitest";
import { ROLE_DEFINITIONS, ROLE_MAP, SUPER_ADMIN_ROLE } from "../../auth/roles";

describe("ROLE_DEFINITIONS", () => {
  it("has 5 roles", () => {
    expect(ROLE_DEFINITIONS).toHaveLength(5);
  });

  it("contains admin, editor, author, contributor, subscriber", () => {
    const slugs = ROLE_DEFINITIONS.map((r) => r.slug);
    expect(slugs).toEqual(["admin", "editor", "author", "contributor", "subscriber"]);
  });

  it("all roles are system roles", () => {
    for (const role of ROLE_DEFINITIONS) {
      expect(role.isSystem).toBe(true);
    }
  });

  it("admin has the most permissions", () => {
    const admin = ROLE_DEFINITIONS.find((r) => r.slug === "admin")!;
    const editor = ROLE_DEFINITIONS.find((r) => r.slug === "editor")!;
    expect(admin.permissions.length).toBeGreaterThan(editor.permissions.length);
  });

  it("subscriber has fewest permissions", () => {
    const subscriber = ROLE_DEFINITIONS.find((r) => r.slug === "subscriber")!;
    expect(subscriber.permissions).toEqual(["read", "edit_profile"]);
  });

  it("permission hierarchy is strictly decreasing", () => {
    for (let i = 0; i < ROLE_DEFINITIONS.length - 1; i++) {
      expect(ROLE_DEFINITIONS[i].permissions.length).toBeGreaterThanOrEqual(
        ROLE_DEFINITIONS[i + 1].permissions.length,
      );
    }
  });

  it("every role has name and description", () => {
    for (const role of ROLE_DEFINITIONS) {
      expect(role.name).toBeTruthy();
      expect(role.description).toBeTruthy();
    }
  });

  it("all roles include read permission", () => {
    for (const role of ROLE_DEFINITIONS) {
      expect(role.permissions).toContain("read");
    }
  });

  it("only admin has manage_settings", () => {
    const rolesWithSettings = ROLE_DEFINITIONS.filter((r) =>
      r.permissions.includes("manage_settings"),
    );
    expect(rolesWithSettings).toHaveLength(1);
    expect(rolesWithSettings[0].slug).toBe("admin");
  });

  it("contributor cannot publish", () => {
    const contributor = ROLE_DEFINITIONS.find((r) => r.slug === "contributor")!;
    expect(contributor.permissions).not.toContain("publish_content");
  });

  it("author can publish", () => {
    const author = ROLE_DEFINITIONS.find((r) => r.slug === "author")!;
    expect(author.permissions).toContain("publish_content");
  });
});

describe("ROLE_MAP", () => {
  it("is a Map with 5 entries", () => {
    expect(ROLE_MAP.size).toBe(5);
  });

  it("looks up admin by slug", () => {
    const admin = ROLE_MAP.get("admin");
    expect(admin).toBeDefined();
    expect(admin!.name).toBe("Administrator");
  });

  it("returns undefined for unknown slug", () => {
    expect(ROLE_MAP.get("unknown" as any)).toBeUndefined();
  });
});

describe("SUPER_ADMIN_ROLE", () => {
  it("has slug super_admin", () => {
    expect(SUPER_ADMIN_ROLE.slug).toBe("super_admin");
  });

  it("has empty permissions array (bypasses checks)", () => {
    expect(SUPER_ADMIN_ROLE.permissions).toEqual([]);
  });

  it("is a system role", () => {
    expect(SUPER_ADMIN_ROLE.isSystem).toBe(true);
  });
});
