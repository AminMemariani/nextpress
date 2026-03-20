/**
 * Permission engine unit tests.
 *
 * Tests pure functions only — no DB, no async, no setup.
 * These are the fastest tests in the suite.
 */

import { describe, it, expect } from "vitest";
import {
  can,
  canEditContent,
  canDeleteContent,
  canPublishContent,
  canAccessAdmin,
} from "../../auth/permissions";
import { mockAuth, mockContributorAuth, mockEditorAuth } from "../helpers";

describe("can()", () => {
  it("grants permission when role has it", () => {
    const auth = mockAuth();
    expect(can(auth, "create_content").granted).toBe(true);
  });

  it("denies permission when role lacks it", () => {
    const auth = mockContributorAuth();
    expect(can(auth, "publish_content").granted).toBe(false);
  });

  it("super_admin bypasses all checks", () => {
    const auth = mockAuth({ role: "super_admin" });
    expect(can(auth, "manage_sites").granted).toBe(true);
    expect(can(auth, "delete_users").granted).toBe(true);
  });

  it("returns reason on denial", () => {
    const auth = mockContributorAuth();
    const result = can(auth, "manage_plugins");
    expect(result.granted).toBe(false);
    if (!result.granted) {
      expect(result.reason).toContain("contributor");
      expect(result.reason).toContain("manage_plugins");
    }
  });
});

describe("canEditContent() — ownership", () => {
  it("allows editing own content with edit_own_content", () => {
    const auth = mockContributorAuth();
    const result = canEditContent(auth, auth.user.id);
    expect(result.granted).toBe(true);
  });

  it("denies editing others' content without edit_others_content", () => {
    const auth = mockContributorAuth();
    const result = canEditContent(auth, "other-user-id");
    expect(result.granted).toBe(false);
  });

  it("allows editing others' content with edit_others_content", () => {
    const auth = mockEditorAuth();
    const result = canEditContent(auth, "other-user-id");
    expect(result.granted).toBe(true);
  });
});

describe("canDeleteContent() — ownership", () => {
  it("allows deleting own content", () => {
    const auth = mockContributorAuth();
    expect(canDeleteContent(auth, auth.user.id).granted).toBe(true);
  });

  it("denies deleting others' content for contributors", () => {
    const auth = mockContributorAuth();
    expect(canDeleteContent(auth, "other-user-id").granted).toBe(false);
  });

  it("allows deleting others' content for editors", () => {
    const auth = mockEditorAuth();
    expect(canDeleteContent(auth, "other-user-id").granted).toBe(true);
  });
});

describe("canPublishContent()", () => {
  it("allows for authors and above", () => {
    const auth = mockAuth({ role: "author", permissions: new Set(["create_content", "publish_content", "read", "edit_profile", "edit_own_content", "delete_own_content", "upload_media"]) });
    expect(canPublishContent(auth).granted).toBe(true);
  });

  it("denies for contributors", () => {
    const auth = mockContributorAuth();
    expect(canPublishContent(auth).granted).toBe(false);
  });
});

describe("canAccessAdmin()", () => {
  it("allows any authenticated user with read permission", () => {
    const auth = mockContributorAuth();
    expect(canAccessAdmin(auth).granted).toBe(true);
  });

  it("denies if read permission missing", () => {
    const auth = mockAuth({ permissions: new Set() });
    expect(canAccessAdmin(auth).granted).toBe(false);
  });
});
