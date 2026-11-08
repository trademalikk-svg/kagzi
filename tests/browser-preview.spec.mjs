import { test, expect } from '@playwright/test';

const previewUrl = process.env.KAGZI_PREVIEW_URL;

test('KAGZI preview serves the public homepage', async ({ page }) => {
  expect(previewUrl, 'KAGZI_PREVIEW_URL must be configured').toBeTruthy();
  const response = await page.goto(previewUrl, { waitUntil: 'domcontentloaded' });
  expect(response, 'preview should return an HTTP response').not.toBeNull();
  expect(response.status(), 'preview homepage should return HTTP 200').toBe(200);
  await expect(page.locator('body')).toBeVisible();
  await expect(page).toHaveTitle(/KAGZI/i);
});

test('KAGZI preview has no uncaught page errors during initial load', async ({ page }) => {
  expect(previewUrl).toBeTruthy();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(previewUrl, { waitUntil: 'networkidle' });
  expect(pageErrors).toEqual([]);
});
