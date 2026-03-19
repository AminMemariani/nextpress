/**
 * Test setup for packages/core.
 *
 * Provides:
 *   - Test database connection (uses TEST_DATABASE_URL)
 *   - Database cleanup between tests
 *   - Mock auth context factory
 *   - Common test fixtures
 */

import { PrismaClient } from "@prisma/client";
import type { AuthContext, PermissionSlug } from "../auth/auth-types";

// ── Test database ──

export const testPrisma = new PrismaClient({
  datasourceUrl: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL,
});

beforeAll(async () => {
  // Verify connection
  await testPrisma.$connect();
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

// ── Test helpers ──

/** Create a mock AuthContext for testing */
export function mockAuth(overrides: Partial<AuthContext> = {}): AuthContext {
  return {
    user: {
      id: "test-user-id",
      email: "test@example.com",
      name: "Test User",
      displayName: "Test User",
      image: null,
    },
    siteId: "test-site-id",
    role: "admin",
    permissions: new Set<PermissionSlug>([
      "create_content", "edit_own_content", "edit_others_content",
      "delete_own_content", "delete_others_content", "publish_content",
      "manage_categories", "manage_tags", "upload_media", "delete_media",
      "moderate_comments", "list_users", "create_users", "edit_users",
      "delete_users", "promote_users", "switch_themes", "customize_theme",
      "manage_menus", "activate_plugins", "manage_plugins", "manage_settings",
      "manage_content_types", "manage_fields", "manage_taxonomies",
      "manage_sites", "read", "edit_profile",
    ]),
    ...overrides,
  };
}

/** Create a contributor auth (limited permissions) */
export function mockContributorAuth(): AuthContext {
  return mockAuth({
    role: "contributor",
    permissions: new Set<PermissionSlug>([
      "create_content", "edit_own_content", "delete_own_content",
      "read", "edit_profile",
    ]),
  });
}

/** Create an editor auth */
export function mockEditorAuth(): AuthContext {
  return mockAuth({
    role: "editor",
    permissions: new Set<PermissionSlug>([
      "create_content", "edit_own_content", "edit_others_content",
      "delete_own_content", "delete_others_content", "publish_content",
      "manage_categories", "manage_tags", "upload_media", "delete_media",
      "moderate_comments", "list_users", "manage_menus", "read", "edit_profile",
    ]),
  });
}

/** Clean up test data between tests */
export async function cleanDatabase() {
  const tables = [
    "field_values", "content_terms", "content_media", "revisions",
    "comments", "menu_items", "menus", "content_entries", "terms",
    "taxonomies", "field_definitions", "content_types", "media_assets",
    "settings", "plugin_installs", "theme_installs", "user_sites",
    "role_permissions", "user_meta", "verification_tokens", "sessions",
    "accounts",
  ];
  for (const table of tables) {
    await testPrisma.$executeRawUnsafe(`DELETE FROM ${table}`);
  }
}
