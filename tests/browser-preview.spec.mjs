import { test, expect } from '@playwright/test';

const baseUrl = process.env.KAGZI_PREVIEW_URL || 'https://feat-resume-maker-production.kagzi-8cy.pages.dev';

test('Resume & CV Maker loads, updates the live preview, and exposes print action', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto(baseUrl + '/resume-cv-maker.html', { waitUntil: 'networkidle' });
  await expect(page).toHaveTitle(/Free Resume & CV Maker Online/);
  await page.locator('#fullName').fill('KAGZI Test Candidate');
  await expect(page.locator('#cvPreview h2')).toHaveText('KAGZI Test Candidate');
  await page.locator('#education').fill('Bachelor degree — Test University — 2026');
  await expect(page.locator('#cvPreview')).toContainText('Test University');
  await expect(page.locator('#printCv')).toBeVisible();
  expect(pageErrors).toEqual([]);
});
