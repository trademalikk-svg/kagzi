import { test, expect } from '@playwright/test';

const baseURL = process.env.KAGZI_PREVIEW_URL || 'https://fix-public-free-access-previ.kagzi-8cy.pages.dev';

test.describe('KAGZI anonymous access and browser regression', () => {
  test('homepage has no public Login/Sign Up header actions', async ({ page }) => {
    await page.goto(baseURL + '/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('.vip-topbar .vip-auth')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /paid library/i }).first()).toBeVisible();
  });

  for (const route of ['/pdf-editor.html', '/photo-tools.html', '/jan-seva.html', '/modules.html', '/add-text-notes-to-pdf-guide.html', '/compress-photo-to-20kb-50kb.html', '/extract-hindi-text-from-image-ocr-guide.html', '/free-pdf-merge.html', '/gov-documents.html', '/jpg-to-pdf.html', '/mobile-scan-to-pdf-guide.html', '/passport-size-photo-maker.html', '/pdf-compress.html', '/pdf-tools.html', '/prepare-documents-for-online-forms-guide.html', '/split-pdf-pages-guide.html']) {
    test(route + ' is accessible without authentication', async ({ page }) => {
      await page.goto(baseURL + route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible();
      await expect.poll(() => new URL(page.url()).pathname).not.toBe('/auth.html');
    });
  }

  test('public paid catalogue stays open while private My Paid Library redirects', async ({ page }) => {
    await page.goto(baseURL + '/paid-library.html', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /paid pdf library/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /login/i }).first()).toBeVisible();

    await page.goto(baseURL + '/current-affairs/my-library.html', { waitUntil: 'domcontentloaded' });
    await expect.poll(() => new URL(page.url()).pathname, { timeout: 15000 }).toBe('/auth.html');
  });

  test('PDF Editor opens, exports, and reopens a one-page edited PDF', async ({ page }) => {
    await page.goto(baseURL + '/pdf-editor.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__kagziPdfEditorInitialized === true && !!window.PDFLib && !!window.pdfjsLib, null, { timeout: 30000 });

    const pdfBytes = await page.evaluate(async () => {
      const doc = await window.PDFLib.PDFDocument.create();
      const page = doc.addPage([420, 595]);
      page.drawText('KAGZI SAVE REOPEN TEST', { x: 40, y: 520, size: 18 });
      return Array.from(await doc.save());
    });
    await page.locator('#pdfFileInput').setInputFiles({
      name: 'kagzi-regression.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from(pdfBytes)
    });
    await expect(page.locator('#pageCount')).toHaveText('1', { timeout: 20000 });
    await expect(page.locator('#downloadEditedPdf')).toBeEnabled();

    await page.locator('#watermarkText').fill('KAGZI REGRESSION');
    await expect(page.locator('#applyWatermark')).toBeEnabled();
    await page.locator('#applyWatermark').click();
    await expect(page.locator('#editorStatus')).toContainText('Watermark applied', { timeout: 15000 });

    const downloadPromise = page.waitForEvent('download');
    await page.locator('#downloadEditedPdf').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('-edited.pdf');
    const savedPath = await download.path();
    const savedBytes = await import('node:fs/promises').then(fs => fs.readFile(savedPath));

    const reopened = await page.evaluate(async (bytes) => {
      const pdf = await window.PDFLib.PDFDocument.load(new Uint8Array(bytes));
      return { pageCount: pdf.getPageCount(), size: bytes.length };
    }, Array.from(savedBytes));
    expect(reopened.pageCount).toBe(1);
    expect(reopened.size).toBeGreaterThan(500);

    await page.locator('#pdfFileInput').setInputFiles({
      name: 'kagzi-regression-edited.pdf',
      mimeType: 'application/pdf',
      buffer: savedBytes
    });
    await expect(page.locator('#pageCount')).toHaveText('1', { timeout: 20000 });
    await expect(page.locator('#editorStatus')).toContainText('kagzi-regression-edited.pdf', { timeout: 20000 });

    const extractedText = await page.evaluate(async () => {
      const file = document.querySelector('#pdfFileInput').files[0];
      const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
      const page = await pdf.getPage(1);
      const content = await page.getTextContent();
      const value = content.items.map(item => item.str).join(' ');
      await pdf.destroy();
      return value;
    });
    expect(extractedText).toContain('KAGZI SAVE REOPEN TEST');
    expect(extractedText).toContain('KAGZI REGRESSION');
  });

  test('mobile viewport keeps the public homepage within the screen width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(baseURL + '/', { waitUntil: 'domcontentloaded' });
    const widths = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, page: document.documentElement.scrollWidth }));
    expect(widths.page).toBeLessThanOrEqual(widths.viewport + 2);
  });
});
