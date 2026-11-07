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
  assert.match(editor, /selectedText\.span\.style\.background(Color)?\s*=/);
  assert.match(editor, /selectedText\.span\.style\.webkitTextFillColor/);
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
