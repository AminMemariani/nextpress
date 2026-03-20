/**
 * Test setup for packages/core.
 *
 * Provides:
 *   - Test database connection (uses TEST_DATABASE_URL)
 *   - Database cleanup between tests
 *   - Mock auth context factory (re-exported from helpers)
 */

import { PrismaClient } from "@prisma/client";

// Re-export helpers so existing integration test imports keep working
export { mockAuth, mockContributorAuth, mockEditorAuth } from "./helpers";

// ── Test database ──

export const testPrisma = new PrismaClient({
  datasourceUrl: process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL,
});

beforeAll(async () => {
  await testPrisma.$connect();
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

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
