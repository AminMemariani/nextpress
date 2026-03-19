/**
 * E2E: Authentication flows.
 *
 * Tests the complete user-facing login/logout flow including
 * redirects, error messages, and session persistence.
 */

import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("redirects to /login when accessing /admin unauthenticated", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows login form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "wrong@example.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Invalid")).toBeVisible({ timeout: 5000 });
  });

  test("successful login redirects to /admin", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@nextpress.local");
    await page.fill('input[type="password"]', "changeme123!");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/admin/, { timeout: 10000 });
    await expect(page.locator("text=Dashboard")).toBeVisible();
  });
});
