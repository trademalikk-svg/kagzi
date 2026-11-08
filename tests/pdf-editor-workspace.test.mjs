import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('PDF editor exposes document-first workspace regions and accessible file/export controls', async () => {
  const html = await readFile(new URL('../pdf-editor.html', import.meta.url), 'utf8');
  for (const id of ['pdfPageRail', 'pdfCanvasHost', 'pdfInspector', 'pdfSelectionProperties', 'pdfFileInput', 'downloadEditedPdf']) {
    assert.match(html, new RegExp('id="' + id + '"'), 'missing workspace region/control: ' + id);
  }
});

test('home page routes users to PDF editor and does not embed the image editor', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.doesNotMatch(html, /<iframe[^>]+src="image-text-editor\.html"/i);
  assert.match(html, /href="pdf-editor\.html"/);
});


test('PDF editor exposes camera scanner and five-language local OCR controls', async () => {
  const html = await readFile(new URL('../pdf-editor.html', import.meta.url), 'utf8');
  for (const id of ['openCameraScanner', 'cameraPreview', 'captureScan', 'closeCameraScanner', 'ocrLanguage', 'ocrImageInput', 'scanImageOcr', 'ocrResults']) {
    assert.match(html, new RegExp('id="' + id + '"'), 'missing scanner/OCR control: ' + id);
  }
  for (const language of ['eng', 'hin', 'urd', 'ben', 'mar']) assert.match(html, new RegExp('value="' + language + '"'));
  assert.match(html, /tesseract/i);
});

test('PDF editor exposes redo, annotations, text alignment and editing controls', async () => {
  const html = await readFile(new URL('../pdf-editor.html', import.meta.url), 'utf8');
  for (const id of ['redoEdit', 'annotationTool', 'inspectorAlignment', 'inspectorFontSize', 'inspectorFontColor', 'deletePage', 'rotatePage', 'movePageUp', 'movePageDown']) {
    assert.match(html, new RegExp('id="' + id + '"'), 'missing editor control: ' + id);
  }
});


test('PDF editor wires camera bridge inside initialized editor scope', async () => {
  const js = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  assert.match(js, /window\.KAGZIPdfEditorOpenFile=loadPdf/);
  assert.match(js, /window\.KAGZIPdfEditorAppendScan=async\(blob\)/);
  assert.doesNotMatch(js, /\nwindow\.KAGZIPdfEditorOpenFile=loadPdf/);
  assert.match(js, /window\.KAGZIPdfEditorDetectPageText=detectPageText/);
});

test('PDF editor provides local merge and split handlers', async () => {
  const html = await readFile(new URL('../pdf-editor.html', import.meta.url), 'utf8');
  const js = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  for (const id of ['mergePdfInput', 'mergePdfButton', 'splitStartPage', 'splitEndPage', 'splitPdfButton']) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  assert.match(js, /copyPages\(source,source\.getPageIndices\(\)\)/);
  assert.match(js, /copyPages\(source,indices\)/);
});

test('PDF filename validation and OCR word wrapping use the intended regular expressions', async () => {
  const js = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  assert.ok(js.includes('!/\\.pdf$/i'));
  assert.ok(js.includes('paragraph.split(/\\s+/)'));
});

test('reviewed OCR text can be appended to an open PDF as clearly labeled visual pages', async () => {
  const html = await readFile(new URL('../pdf-editor.html', import.meta.url), 'utf8');
  const js = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  const scanner = await readFile(new URL('../pdf-scanner.js', import.meta.url), 'utf8');
  assert.match(html, /id="addOcrTextPage"/);
  assert.match(js, /window\.KAGZIPdfEditorAppendOcrText=async\(text\)/);
  assert.match(js, /image-based text, not a searchable text layer/);
  assert.match(js, /value\.replace\(/);
  assert.match(scanner, /addOcrTextPage/);
  assert.match(scanner, /KAGZIPdfEditorHasDocument/);
});

test('PDF editor loads local OCR and camera scripts before the editor initializer', async () => {
  const html = await readFile(new URL('../pdf-editor.html', import.meta.url), 'utf8');
  assert.ok(html.indexOf('src="pdf-ocr.js"') < html.indexOf('src="pdf-editor.js"'));
  assert.ok(html.indexOf('src="pdf-scanner.js"') < html.indexOf('src="pdf-editor.js"'));
});


test('live text preview masks the original PDF glyphs before showing replacement text', async () => {
  const js = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  const preview = js.match(/function previewSelectedText\(\)\{[\s\S]*?\n?\s*\}/);
  assert.ok(preview, 'live preview handler exists');
  assert.match(preview[0], /classList\.add\(['"]edited['"]\)/,
    'preview must apply the white-backed edited layer so original PDF glyphs do not show through');
});

test('text Inspector commits every visible style property and exports the committed overlay', async () => {
  const js = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  const apply = js.match(/if\(el\.applyTextEdit\)[\s\S]*?;\n\s*\['inspectorText'/);
  assert.ok(apply, 'Apply handler and Inspector preview wiring must exist');
  for (const property of ['fontSize', 'bold', 'align', 'fontFamily', 'color', 'opacity']) {
    assert.match(apply[0], new RegExp(property), 'Apply must persist ' + property);
  }
  const exportHandler = js.match(/el\.downloadEditedPdf\.addEventListener\('click',[\s\S]*?\n\s*if\(el\.applyTextEdit\)/);
  assert.ok(exportHandler, 'PDF export handler must exist');
  for (const property of ['fontSize', 'bold', 'align', 'fontFamily', 'color', 'opacity']) {
    assert.match(exportHandler[0], new RegExp('edit\\.' + property), 'Export must use committed ' + property);
  }
});

test('mobile PDF Inspector is ordered before the document canvas while desktop keeps it in the side column', async () => {
  const html = await readFile(new URL('../pdf-editor.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../pdf-editor.css', import.meta.url), 'utf8');
  assert.ok(html.indexOf('class="pdf-inspector"') < html.indexOf('class="document-area"') || html.indexOf('class="pdf-inspector"') > html.indexOf('class="document-area"'),
    'Inspector and document workspace must both be present');
  assert.match(css, /grid-template-areas:"rail document inspector"/,
    'desktop workspace must retain a right-side Inspector');
  assert.match(css, /@media\(max-width:650px\)[\s\S]*?grid-template-areas:"rail" "inspector" "document"/,
    'mobile workspace must place Inspector above the PDF document');
});
