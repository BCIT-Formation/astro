// Playwright smoke tests for the main flow.
// The dev server is started automatically (see playwright.config.ts).
import { test, expect } from "@playwright/test";

test("page loads with AstroVision title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/AstroVision/);
});

test("form inputs are present", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("input[type='date']")).toBeVisible();
  await expect(page.locator("input[type='time']")).toBeVisible();
  await expect(page.locator("select")).toBeVisible();
});

test("health API returns ok", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  const body = await response.json() as { status: string };
  expect(body.status).toBe("ok");
});

test("submit button is disabled without birth date", async ({ page }) => {
  await page.goto("/");
  const submitButton = page.locator("button[type='submit']");
  await expect(submitButton).toBeDisabled();
});
