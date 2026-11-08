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
    await expect(page.locator('#pdfTextLayer')).toContainText('REPLACED');
    await expect(page.locator('#pdfTextLayer')).not.toContainText('ORIGINAL');
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

test('browser preserves Devanagari matra and conjunct shaping after native replacement and export', async ({ page }) => {
  const directory = await mkdtemp(join(tmpdir(), 'kagzi-pdfium-hindi-'));
  const fixture = join(directory, 'devanagari-source.pdf');
  const expectedFixture = join(directory, 'devanagari-expected.pdf');
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  try {
    const fontUrl = 'https://raw.githubusercontent.com/notofonts/noto-fonts/4c73b21790f0e0c0a51bb947e78f98646e6c49c2/hinted/ttf/NotoSansDevanagari/NotoSansDevanagari-Regular.ttf';
    const fontResponse = await fetch(fontUrl);
    expect(fontResponse.ok).toBe(true);
    const fontBytes = Array.from(new Uint8Array(await fontResponse.arrayBuffer()));

    // The editor loads these libraries from jsDelivr. In CI, that CDN can
    // intermittently fail even when the local editor itself is served correctly.
    // Keep fixture generation deterministic with an equivalent unpkg fallback.
    await page.waitForTimeout(500);
    if (!await page.evaluate(() => Boolean(window.PDFLib?.PDFDocument))) {
      await page.addScriptTag({ url: 'https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js' });
    }
    if (!await page.evaluate(() => Boolean(window.fontkit))) {
      await page.addScriptTag({ url: 'https://unpkg.com/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js' });
    }
    await expect.poll(() => page.evaluate(() =>
      Boolean(window.PDFLib?.PDFDocument && window.fontkit)
    ), { timeout: 15000 }).toBe(true);

    const generated = await page.evaluate(async bytes => {
      async function createPdf(visibleText) {
        const document = await PDFLib.PDFDocument.create();
        document.registerFontkit(window.fontkit);
        const font = await document.embedFont(new Uint8Array(bytes), { subset: false });
        const page = document.addPage([600, 220]);
        page.drawText(visibleText, {
          x: 48, y: 110, size: 36, font,
          color: PDFLib.rgb(0, 0, 0)
        });
        // Include the source characters in the embedded font's ToUnicode map
        // without making a duplicate exact text item for the replacement.
        page.drawText('क ् ष े त ् र', {
          x: 48, y: 10, size: 1, font,
          color: PDFLib.rgb(1, 1, 1)
        });
        return Array.from(await document.save());
      }
      return {
        source: await createPdf('ORIGINAL'),
        expected: await createPdf('क्षेत्र')
      };
    }, fontBytes);

    await writeFile(fixture, Buffer.from(generated.source));
    await writeFile(expectedFixture, Buffer.from(generated.expected));

    const baseUrl = process.env.KAGZI_PDF_EDITOR_URL || 'http://127.0.0.1:4173/pdf-editor.html';
    const response = await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    expect(response?.status()).toBe(200);
    await expect.poll(() => page.evaluate(() => window.KAGZIPdfNativeText?.status().enabled === true), { timeout: 30000 }).toBe(true);

    await page.locator('#pdfFileInput').setInputFiles(fixture);
    await expect(page.locator('#pageCount')).toHaveText('1', { timeout: 30000 });
    await expect(page.locator('#pdfTextLayer')).toContainText('ORIGINAL', { timeout: 30000 });
    await page.locator('#pdfTextLayer .pdf-text-span').filter({ hasText: 'ORIGINAL' }).click();
    await expect(page.locator('#inspectorText')).toHaveValue('ORIGINAL');
    await page.locator('#inspectorText').fill('क्षेत्र');
    await page.locator('#nativeEditText').click();

    await expect(page.locator('#editorStatus')).toContainText('Save/Reopen verification passed', { timeout: 60000 });
    await expect(page.locator('#pdfTextLayer')).toContainText('क्षेत्र');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('#downloadEditedPdf').click()
    ]);
    const exportedPath = await download.path();
    expect(exportedPath).toBeTruthy();
    await page.locator('#pdfFileInput').setInputFiles(exportedPath);
    await expect(page.locator('#pdfTextLayer')).toContainText('क्षेत्र', { timeout: 30000 });

    const visual = await page.evaluate(async expectedBytes => {
      const expectedPdf = await pdfjsLib.getDocument({ data: new Uint8Array(expectedBytes) }).promise;
      const expectedPage = await expectedPdf.getPage(1);
      const actualCanvas = document.querySelector('#pdfCanvas');
      const scale = actualCanvas.width / expectedPage.getViewport({ scale: 1 }).width;
      const viewport = expectedPage.getViewport({ scale });
      const expectedCanvas = document.createElement('canvas');
      expectedCanvas.width = actualCanvas.width;
      expectedCanvas.height = actualCanvas.height;
      await expectedPage.render({
        canvasContext: expectedCanvas.getContext('2d'),
        viewport
      }).promise;

      const actual = actualCanvas.getContext('2d').getImageData(0, 0, actualCanvas.width, actualCanvas.height).data;
      const expected = expectedCanvas.getContext('2d').getImageData(0, 0, expectedCanvas.width, expectedCanvas.height).data;
      let differentInkPixels = 0;
      let expectedInkPixels = 0;
      for (let i = 0; i < expected.length; i += 4) {
        const ink = expected[i] < 250 || expected[i + 1] < 250 || expected[i + 2] < 250;
        if (!ink) continue;
        expectedInkPixels++;
        const delta = Math.abs(actual[i] - expected[i]) +
          Math.abs(actual[i + 1] - expected[i + 1]) +
          Math.abs(actual[i + 2] - expected[i + 2]);
        if (delta > 45) differentInkPixels++;
      }
      return {
        differentInkPixels,
        expectedInkPixels,
        differenceRatio: differentInkPixels / Math.max(1, expectedInkPixels)
      };
    }, generated.expected);

    expect(visual.differenceRatio).toBeLessThan(0.02);
    expect(pageErrors).toEqual([]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

