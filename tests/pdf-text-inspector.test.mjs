import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('mobile text inspector is a side drawer instead of a page section', async () => {
  const workspace = await readFile(new URL('../pdf-editor-workspace.js', import.meta.url), 'utf8');
  const css = await readFile(new URL('../pdf-editor-workspace.css', import.meta.url), 'utf8');

  assert.match(workspace, /is-mobile-drawer/);
  assert.match(workspace, /is-open/);
  assert.match(css, /\.pdf-inspector\.is-mobile-drawer/);
  assert.match(css, /position:\s*fixed/);
  assert.match(css, /right:\s*0/);
  assert.match(css, /#pdfInspector\.is-mobile-drawer:not\(\.is-open\)/);
});

test('live text preview expands to fit replacement text and paints it above the PDF text layer', async () => {
  const editor = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');

  assert.match(editor, /measureText\(/);
  assert.match(editor, /span\.style\.width=/);
  assert.match(editor, /span\.style\.backgroundColor=/);
  assert.match(editor, /span\.style\.webkitTextFillColor=/);
});

test('selected PDF text loads its original size and available font style into the inspector', async () => {
  const editor = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  const html = await readFile(new URL('../pdf-editor.html', import.meta.url), 'utf8');

  assert.match(editor, /content\.styles\[item\.fontName\]/);
  assert.match(editor, /fontHeight\/Math\.max\(\.01,viewport\.scale\)/);
  assert.match(editor, /inspectorFontSize\.value=String\(Number\(originalFontSize\.toFixed\(2\)\)\)/);
  assert.match(editor, /inspectorItalic\.checked=isItalic/);
  assert.match(editor, /span\.style\.fontSize=previewSize\+'px'/);
  assert.match(editor, /italic:!!\(el\.inspectorItalic&&el\.inspectorItalic\.checked\)/);
  assert.match(editor, /fontKey=family\+\(edit\.bold\?'Bold':''\)\+\(edit\.italic\?/);
  assert.match(editor, /Math\.min\(96,edit\.fontSize\)/);
  assert.match(editor, /fontKey=family\+\(edit\.bold\?'Bold':''\)\+\(edit\.italic\?/);
  assert.match(editor, /Math\.min\(96,edit\.fontSize\)/);
  assert.match(html, /id="inspectorItalic"/);
});


test('italic styling is applied to direct text overlays and Unicode raster export', async () => {
  const editor = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  const unicode = await readFile(new URL('../pdf-unicode-text.js', import.meta.url), 'utf8');

  assert.match(editor, /inspectorItalic&&el\.inspectorItalic\.checked\?\(baseFont==='TimesRoman'\?'Italic':'Oblique'\)/);
  assert.match(unicode, /opts\.italic\?'italic '/);
});


test('new text tool shows and positions a live preview before placement', async () => {
  const editor = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');

  assert.match(editor, /function paintPendingTextPreview\(\)/);
  assert.match(editor, /pendingTextPreview\.textContent=value/);
  assert.match(editor, /el\.editorOverlay\.addEventListener\('pointermove'/);
  assert.match(editor, /paintPendingTextPreview\(\);status\('नया टेक्स्ट लिखें/);
});


test('inspector shows a live preview above all text editing controls', async () => {
  const html = await readFile(new URL('../pdf-editor.html', import.meta.url), 'utf8');
  const editor = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  const preview = html.indexOf('id="inspectorLivePreview"');
  const textEditor = html.indexOf('id="inspectorText"');
  assert.ok(preview >= 0 && textEditor > preview, 'Live Preview must appear before the text editor in the inspector');
  assert.match(editor, /function paintInspectorLivePreview\(/);
  assert.match(editor, /paintInspectorLivePreview\(value/);
});

test('all visible text formatting controls refresh the live preview', async () => {
  const editor = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  for (const id of ['inspectorText','inspectorFontSize','inspectorFontFamily','inspectorFontColor','inspectorAlignment','inspectorOpacity','inspectorBold','inspectorItalic']) {
    assert.match(editor, new RegExp("'" + id + "'"));
  }
  assert.match(editor, /paintInspectorLivePreview\(value/);
});

test('mobile inspector is placed in normal page flow above the PDF workspace, not in a drawer', async () => {
  const workspace = await readFile(new URL('../pdf-editor-workspace.js', import.meta.url), 'utf8');
  const css = await readFile(new URL('../pdf-editor-workspace.css', import.meta.url), 'utf8');
  assert.match(workspace, /shell\.insertBefore\(inspector, workspace\)/);
  assert.doesNotMatch(workspace, /is-mobile-drawer/);
  assert.doesNotMatch(css, /translateX\(calc\(100% - 48px\)\)/);
  assert.match(css, /\.editor-shell>#pdfInspector/);
});
