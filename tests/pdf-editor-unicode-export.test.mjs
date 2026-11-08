import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('PDF export rasterizes non-Latin replacement text instead of passing it to WinAnsi standard fonts', async () => {
  const js = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  const exportHandler = js.slice(js.indexOf("el.downloadEditedPdf.addEventListener('click'"), js.indexOf('if(el.applyTextEdit)'));
  assert.match(exportHandler, /codePointAt\(0\)>255/);
  assert.match(exportHandler, /embedPng/);
  assert.match(exportHandler, /drawImage/);
  assert.match(exportHandler, /drawText/);
});

test('Unicode PDF export wraps long text to the selected text box and respects its height', async () => {
  const js = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  const exportHandler = js.slice(js.indexOf("el.downloadEditedPdf.addEventListener('click'"), js.indexOf('if(el.applyTextEdit)'));
  assert.match(js, /function wrapCanvasText\(/);
  assert.match(exportHandler, /wrapCanvasText\(ctx,edit\.text,boxWidth\)/);
  assert.match(exportHandler, /lineHeight/);
  assert.match(exportHandler, /boxHeight/);
});

test('Hindi export prefers embedded Unicode font text and keeps a local-render fallback', async () => {
  const js = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  const html = await readFile(new URL('../pdf-editor.html', import.meta.url), 'utf8');
  assert.match(html, /@pdf-lib\/fontkit@/);
  assert.match(js, /registerFontkit/);
  assert.match(js, /embedFont\(.*fontBytes/s);
  assert.match(js, /NotoSansDevanagari-Regular\.ttf/);
  assert.match(js, /embedPng/);
});
