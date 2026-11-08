import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('PDF export rasterizes non-Latin replacement text instead of passing it to WinAnsi standard fonts', async () => {
  const js = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  const exportHandler = js.slice(js.indexOf("el.downloadEditedPdf.addEventListener('click'"), js.indexOf('if(el.applyTextEdit)'));
  assert.match(exportHandler, /[^\n]*\\u00ff/);
  assert.match(exportHandler, /embedPng/);
  assert.match(exportHandler, /drawImage/);
  assert.match(exportHandler, /drawText/);
});
