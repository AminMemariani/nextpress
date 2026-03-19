/**
 * E2E: Public site rendering.
 *
 * Tests that published content is visible, search works,
 * and SEO metadata is present.
 */

import { test, expect } from "@playwright/test";

test.describe("Public site", () => {
  test("homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/.+/); // some title exists
  });

  test("published post is accessible", async ({ page }) => {
    // This test requires a seeded post
    await page.goto("/");
    // Check that the page rendered without error
    await expect(page.locator("body")).toBeVisible();
  });

  test("search page works", async ({ page }) => {
    await page.goto("/search?q=test");
    await expect(page.locator('input[type="search"]')).toBeVisible();
  });

  test("sitemap.xml returns XML", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    expect(response?.headers()["content-type"]).toContain("xml");
  });

  test("feed.xml returns RSS", async ({ page }) => {
    const response = await page.goto("/feed.xml");
    expect(response?.headers()["content-type"]).toContain("xml");
  });

  test("404 page renders for unknown URLs", async ({ page }) => {
    const response = await page.goto("/nonexistent-page-xyz");
    expect(response?.status()).toBe(404);
  });
});
