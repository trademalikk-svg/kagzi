import { test, expect } from '@playwright/test';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

function makeStream(content) {
  return `<< /Length ${Buffer.byteLength(content, 'binary')} >>\nstream\n${content}\nendstream`;
}

function makeNestedFormPdf() {
  const objects = [
    null,
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R 8 0 R] /Count 2 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] /Resources << /Font << /F1 6 0 R >> /XObject << /Outer 4 0 R >> >> /Contents 7 0 R >>',
    makeStream('q /Inner Do Q').replace('>>\nstream', ' /Type /XObject /Subtype /Form /FormType 1 /BBox [0 0 300 300] /Resources << /XObject << /Inner 5 0 R >> >> >>\nstream'),
    makeStream('BT /F1 12 Tf 10 100 Td (ORIGINAL) Tj ET').replace('>>\nstream', ' /Type /XObject /Subtype /Form /FormType 1 /BBox [0 0 300 300] /Resources << /Font << /F1 6 0 R >> >> >>\nstream'),
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    makeStream('BT /F1 9 Tf 10 10 Td (PAGECONTROL) Tj ET q /Outer Do Q'),
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 300] /Resources << /Font << /F1 6 0 R >> >> /Contents 9 0 R >>',
    makeStream('BT /F1 12 Tf 10 150 Td (SECOND PAGE PRESERVED) Tj ET')
  ];
  let pdf = '%PDF-1.7\n';
  const offsets = [0];
  for (let i = 1; i < objects.length; i++) {
    offsets[i] = Buffer.byteLength(pdf, 'binary');
    pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xref = Buffer.byteLength(pdf, 'binary');
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objects.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'binary');
}

test('browser replaces nested Form PDF text and preserves page content through export and reopen', async ({ page }) => {
  const directory = await mkdtemp(join(tmpdir(), 'kagzi-pdfium-browser-'));
  const fixture = join(directory, 'nested-form-two-page.pdf');
  await writeFile(fixture, makeNestedFormPdf());
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  try {
    const baseUrl = process.env.KAGZI_PDF_EDITOR_URL || 'http://127.0.0.1:4173/pdf-editor.html';
    const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect.poll(() => page.evaluate(() => window.KAGZIPdfNativeText?.status().enabled === true), { timeout: 30000 }).toBe(true);

    await page.locator('#pdfFileInput').setInputFiles(fixture);
    await expect(page.locator('#pageCount')).toHaveText('2', { timeout: 30000 });
    await expect(page.locator('#pdfTextLayer')).toContainText('ORIGINAL', { timeout: 30000 });
    await expect(page.locator('#pdfTextLayer')).toContainText('PAGECONTROL');

    await page.locator('#pdfTextLayer .pdf-text-span').filter({ hasText: 'ORIGINAL' }).click();
    await expect(page.locator('#inspectorText')).toHaveValue('ORIGINAL');
    await page.locator('#inspectorText').fill('REPLACED');
    await expect(page.locator('#nativeEditText')).toBeEnabled();
    await page.locator('#nativeEditText').click();

    await expect(page.locator('#editorStatus')).toContainText('Save/Reopen verification passed', { timeout: 60000 });
    await expect(page.locator('#pdfTextLayer')).toContainText('REPLACED');
    await expect(page.locator('#pdfTextLayer')).not.toContainText('ORIGINAL');
    await expect(page.locator('#pdfTextLayer')).toContainText('PAGECONTROL');

    await page.locator('#nextPage').click();
    await expect(page.locator('#pdfTextLayer')).toContainText('SECOND PAGE PRESERVED');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#downloadEditedPdf').click()
    ]);
    const exportedPath = await download.path();
    expect(exportedPath).toBeTruthy();
    await page.locator('#pdfFileInput').setInputFiles(exportedPath);
    await expect(page.locator('#pageCount')).toHaveText('2', { timeout: 30000 });
    await expect(page.locator('#pdfTextLayer')).toContainText('REPLACED', { timeout: 30000 });
    await expect(page.locator('#pdfTextLayer')).not.toContainText('ORIGINAL');
    await expect(page.locator('#pdfTextLayer')).toContainText('PAGECONTROL');
    await page.locator('#nextPage').click();
    await expect(page.locator('#pdfTextLayer')).toContainText('SECOND PAGE PRESERVED');
    expect(pageErrors).toEqual([]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
