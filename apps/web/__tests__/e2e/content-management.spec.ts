/**
 * E2E: Content management workflow.
 *
 * Tests creating, editing, publishing, and deleting content
 * through the admin UI.
 */

import { test, expect } from "@playwright/test";

// Helper: login before each test
test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.fill('input[type="email"]', "admin@nextpress.local");
  await page.fill('input[type="password"]', "changeme123!");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin/);
});

test.describe("Content creation", () => {
  test("creates a new post", async ({ page }) => {
    await page.goto("/admin/posts/new");
    await page.fill('input[placeholder="Enter title..."]', "E2E Test Post");
    await page.click("text=Save Draft");
    await expect(page.locator("text=Saved")).toBeVisible({ timeout: 5000 });
  });

  test("publishes a post", async ({ page }) => {
    await page.goto("/admin/posts/new");
    await page.fill('input[placeholder="Enter title..."]', "Published Post");
    await page.click("text=Publish");
    await expect(page.locator("text=Published")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Content listing", () => {
  test("shows posts in the list", async ({ page }) => {
    await page.goto("/admin/posts");
    await expect(page.locator("text=Posts")).toBeVisible();
    // The data table should be present
    await expect(page.locator("table, [class*='table']")).toBeVisible();
  });

  test("filters by status", async ({ page }) => {
    await page.goto("/admin/posts");
    await page.selectOption("select", "DRAFT");
    await expect(page).toHaveURL(/status=DRAFT/);
  });

  test("searches by title", async ({ page }) => {
    await page.goto("/admin/posts");
    await page.fill('input[placeholder="Search..."]', "test");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/search=test/);
  });
});

test.describe("Permission enforcement", () => {
  test("admin sidebar shows all menu items for admin", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.locator("text=Posts")).toBeVisible();
    await expect(page.locator("text=Media")).toBeVisible();
    await expect(page.locator("text=Users")).toBeVisible();
    await expect(page.locator("text=Settings")).toBeVisible();
  });
});
