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
  assert.match(editor, /selectedText\.span\.style\.width/);
  assert.match(editor, /selectedText\.span\.style\.background(Color)?\s*=/);
  assert.match(editor, /selectedText\.span\.style\.webkitTextFillColor/);
});
