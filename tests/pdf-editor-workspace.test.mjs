import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('mobile PDF inspector is inside the document flow directly before the page canvas', async () => {
  const html = await readFile(new URL('../pdf-editor.html', import.meta.url), 'utf8');
  const docTools = html.indexOf('class="document-tools"');
  const inspector = html.indexOf('id="pdfInspector"');
  const pageStage = html.indexOf('class="page-stage"');
  assert.ok(docTools < inspector && inspector < pageStage, 'inspector must sit between document tools and the PDF page');
  const css = await readFile(new URL('../pdf-editor.css', import.meta.url), 'utf8');
  assert.match(css, /\.pdf-inspector\\{position:relative;top:auto/);\n  assert.match(css, /overscroll-behavior:contain/);
  assert.doesNotMatch(css, /\.pdf-inspector\\{grid-column:auto/);
});

test('text tool clicks pass through selectable text spans to place new text', async () => {
  const js = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  assert.match(js, /span\.style\.pointerEvents=t==='select'\?'auto':'none'/);
  assert.match(js, /awaitingNewText=false/);
});

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


test('PDF editor offers a local shared-document session and loads its bridge', async () => {
  const html = await readFile(new URL('../pdf-editor.html', import.meta.url), 'utf8');
  const js = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  const bridge = await readFile(new URL('../pdf-document-session.js', import.meta.url), 'utf8');
  for (const id of ['saveSharedSession', 'restoreSharedSession']) assert.match(html, new RegExp('id="' + id + '"'));
  assert.match(html, /src="pdf-document-session\.js"/);
  assert.match(js, /KAGZIPdfSession\.save/);
  assert.match(js, /KAGZIPdfSession\.load/);
  assert.match(bridge, /indexedDB\.open/);
  assert.match(bridge, /KAGZIPdfSession/);
});


test('PDF.js receives a copy so its worker cannot detach the editor working buffer', async () => {
  const js = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  assert.match(js, /getDocument\(\{data:bytes\.slice\(\)\}\)/);
  assert.match(js, /workingBytes=bytes/);
});


test('mobile inspector exposes cancel action and automatic-direction text input', async () => {
  const html = await readFile(new URL('../pdf-editor.html', import.meta.url), 'utf8');
  assert.match(html, /id="cancelTextEdit"/);
  assert.match(html, /id="inspectorText"[^>]*dir="auto"|dir="auto"[^>]*id="inspectorText"/);
  assert.match(html, /aria-label="[^"]*text/i);
});

test('mobile inspector focus helper handles visual viewport and exposes reveal method', async () => {
  const js = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  assert.match(js, /window\.KAGZIPdfMobileInspector/);
  assert.match(js, /revealActiveField/);
  assert.match(js, /visualViewport/);
  assert.match(js, /scrollIntoView/);
});
