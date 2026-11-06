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
  assert.match(css, /@media\s*\(max-width:\s*1150px\)/);
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


test('PDF note annotations render a bounded note box and readable text on the selected page', async () => {
  const source = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  const sandbox = { window: {}, document: { addEventListener() {} } };
  vm.runInNewContext(source, sandbox);
  assert.equal(typeof sandbox.window.KAGZIPdfCreateNoteAnnotation, 'function',
    'the editor must expose its note-annotation renderer');
  const calls = [];
  const page = {
    getSize: () => ({ width: 300, height: 400 }),
    drawRectangle: options => calls.push({ type: 'rectangle', options }),
    drawText: (text, options) => calls.push({ type: 'text', text, options })
  };
  const PDFLib = {
    StandardFonts: { Helvetica: 'Helvetica' },
    rgb: (r, g, b) => ({ r, g, b })
  };
  const pdfDocument = { embedFont: async name => name };
  const result = await sandbox.window.KAGZIPdfCreateNoteAnnotation(page, pdfDocument, PDFLib, 'Review this section', 280, 390);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { x: 140, y: 328, width: 152, height: 64 });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].type, 'rectangle');
  assert.equal(calls[0].options.x, 140);
  assert.equal(calls[0].options.y, 328);
  assert.equal(calls[1].type, 'text');
  assert.equal(calls[1].text, 'Review this section');
  assert.equal(calls[1].options.maxWidth, 136);
  assert.equal(calls[1].options.font, 'Helvetica');
});

test('PDF note annotation renderer rejects blank notes and missing page geometry', async () => {
  const source = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  const sandbox = { window: {}, document: { addEventListener() {} } };
  vm.runInNewContext(source, sandbox);
  const renderer = sandbox.window.KAGZIPdfCreateNoteAnnotation;
  assert.equal(typeof renderer, 'function');
  const pdfDocument = { embedFont: async name => name };
  assert.equal(await renderer({ getSize: () => ({ width: 300, height: 400 }) }, pdfDocument, { StandardFonts: {}, rgb() {} }, '   ', 20, 20), null);
  assert.equal(await renderer({}, pdfDocument, { StandardFonts: {}, rgb() {} }, 'Note', 20, 20), null);
});


test('a first camera scan does not create an invalid null-byte undo snapshot', async () => {
  const source = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  const sandbox = { window: {}, document: { addEventListener() {} } };
  vm.runInNewContext(source, sandbox);
  const rememberBeforeScan = sandbox.window.KAGZIPdfEditorRememberBeforeAppendScan;
  assert.equal(typeof rememberBeforeScan, 'function',
    'the editor must expose the guarded scan-history boundary');
  let snapshots = 0;
  assert.equal(rememberBeforeScan(null, () => { snapshots += 1; }), false);
  assert.equal(snapshots, 0, 'a new scan must not record an empty-document snapshot');
  assert.equal(rememberBeforeScan(new Uint8Array([1, 2, 3]), () => { snapshots += 1; }), true);
  assert.equal(snapshots, 1, 'an existing document must still be undoable before adding a scan');
  assert.match(source, /rememberBeforeAppendScan\(workingBytes,\s*remember\)/);
});


test('Unicode text renderer shapes Hindi and Urdu with browser canvas before PDF embedding', async () => {
  const source = await readFile(new URL('../pdf-unicode-text.js', import.meta.url), 'utf8');
  const calls = [];
  const context = {
    font: '', direction: 'ltr', textAlign: 'left', textBaseline: 'top', fillStyle: '', globalAlpha: 1,
    scale() {}, clearRect() {},
    measureText: text => ({ width: [...text].length * 12 }),
    fillText: (text, x, y) => calls.push({ text, x, y, direction: context.direction })
  };
  const canvas = { width: 0, height: 0, getContext: () => context, toBlob: callback => callback({ arrayBuffer: async () => new Uint8Array([1,2,3]).buffer }) };
  const sandbox = {
    window: {},
    document: { createElement: name => { assert.equal(name, 'canvas'); return canvas; }, fonts: { ready: Promise.resolve() } },
    Uint8Array, Math, String, Promise
  };
  vm.runInNewContext(source, sandbox);
  const draws = [];
  const pdf = { embedPng: async bytes => { assert.deepEqual([...bytes], [1,2,3]); return 'embedded-image'; } };
  const page = { drawImage: (image, options) => draws.push({ image, options }) };
  const hindi = await sandbox.window.KAGZIPdfUnicodeText.draw(pdf, page, 'हिन्दी पाठ', { x: 10, y: 20, width: 180, fontSize: 18, color: '#17233c' });
  const urdu = await sandbox.window.KAGZIPdfUnicodeText.draw(pdf, page, 'اردو متن', { x: 10, y: 20, width: 180, fontSize: 18, color: '#17233c' });
  assert.equal(hindi, true);
  assert.equal(urdu, true);
  assert.equal(draws.length, 2);
  assert.ok(calls.some(call => call.direction === 'ltr' && call.text.includes('हिन्दी')));
  assert.ok(calls.some(call => call.direction === 'rtl' && call.text.includes('اردو')));
});

test('Unicode text renderer declines Latin text so native searchable PDF text remains available', async () => {
  const source = await readFile(new URL('../pdf-unicode-text.js', import.meta.url), 'utf8');
  const sandbox = { window: {}, document: { createElement() { throw new Error('canvas should not be used for Latin'); } } };
  vm.runInNewContext(source, sandbox);
  assert.equal(await sandbox.window.KAGZIPdfUnicodeText.draw({}, {}, 'English text', {}), false);
});
