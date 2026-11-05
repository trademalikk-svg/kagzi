import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

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


test('mobile workspace exposes accessible page and properties panel toggles', async () => {
  const html = await readFile(new URL('../pdf-editor.html', import.meta.url), 'utf8');
  for (const [buttonId, controlledId] of [
    ['togglePageRail', 'pdfPageRail'],
    ['toggleInspector', 'pdfSelectionProperties']
  ]) {
    assert.match(html, new RegExp('id="' + buttonId + '"'));
    assert.match(html, new RegExp('aria-controls="' + controlledId + '"'));
    assert.match(html, new RegExp('aria-expanded="true"'));
  }
  assert.match(html, /href="pdf-editor-workspace\.css"/);
  assert.match(html, /src="pdf-editor-workspace\.js"/);
  assert.match(html, /KAGZIPdfWorkspace\.init\(document\)/);

  const css = await readFile(new URL('../pdf-editor-workspace.css', import.meta.url), 'utf8');
  assert.match(css, /\.page-rail\.is-collapsed \.page-thumbnails/);
  assert.match(css, /#pdfSelectionProperties\.is-collapsed/);
  assert.match(css, /@media\s*\(max-width:\s*650px\)/);
});

test('workspace panel toggles update collapsed state and accessible labels', async () => {
  const source = await readFile(new URL('../pdf-editor-workspace.js', import.meta.url), 'utf8');
  function element() {
    const classes = new Set();
    const listeners = {};
    const attributes = new Map();
    return {
      listeners,
      textContent: '',
      classList: {
        toggle(name, force) {
          if (force === undefined ? !classes.has(name) : force) classes.add(name);
          else classes.delete(name);
        },
        contains(name) { return classes.has(name); }
      },
      addEventListener(name, callback) { listeners[name] = callback; },
      getAttribute(name) { return attributes.get(name) ?? null; },
      setAttribute(name, value) { attributes.set(name, String(value)); }
    };
  }
  const nodes = {
    togglePageRail: element(),
    pdfPageRailPanel: element(),
    toggleInspector: element(),
    pdfSelectionProperties: element()
  };
  for (const id of ['togglePageRail', 'toggleInspector']) {
    nodes[id].setAttribute('aria-expanded', 'true');
  }
  const document = { getElementById: id => nodes[id] || null };
  const window = {};
  vm.runInNewContext(source, { window, document });
  window.KAGZIPdfWorkspace.init(document);

  nodes.togglePageRail.listeners.click();
  assert.equal(nodes.togglePageRail.getAttribute('aria-expanded'), 'false');
  assert.equal(nodes.pdfPageRailPanel.classList.contains('is-collapsed'), true);
  assert.equal(nodes.togglePageRail.textContent, 'Show pages');
  assert.equal(nodes.togglePageRail.getAttribute('aria-label'), 'Show page thumbnails');

  nodes.togglePageRail.listeners.click();
  assert.equal(nodes.togglePageRail.getAttribute('aria-expanded'), 'true');
  assert.equal(nodes.pdfPageRailPanel.classList.contains('is-collapsed'), false);
  assert.equal(nodes.togglePageRail.textContent, 'Hide pages');
  assert.equal(nodes.togglePageRail.getAttribute('aria-label'), 'Hide page thumbnails');

  nodes.toggleInspector.listeners.click();
  assert.equal(nodes.toggleInspector.getAttribute('aria-expanded'), 'false');
  assert.equal(nodes.pdfSelectionProperties.classList.contains('is-collapsed'), true);
  assert.equal(nodes.toggleInspector.textContent, 'Show properties');
  assert.equal(nodes.toggleInspector.getAttribute('aria-label'), 'Show properties panel');
});
