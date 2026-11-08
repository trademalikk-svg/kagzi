import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Hindi export attempts embedded Unicode font text before using the visual fallback', async () => {
  const js = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  const exportHandler = js.slice(js.indexOf("el.downloadEditedPdf.addEventListener('click'"), js.indexOf('if(el.applyTextEdit)'));
  assert.match(exportHandler, /registerFontkit\(window\.fontkit\)/);
  assert.match(exportHandler, /embedFont\(fontBytes,\{subset:true\}\)/);
  assert.match(exportHandler, /target\.drawText\(edit\.text/);
  assert.match(exportHandler, /embedPng/);
});

test('Unicode fallback wraps long text to the selected box and reports when image fallback is used', async () => {
  const js = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  const exportHandler = js.slice(js.indexOf("el.downloadEditedPdf.addEventListener('click'"), js.indexOf('if(el.applyTextEdit)'));
  assert.match(js, /function wrapCanvasText\(/);
  assert.match(exportHandler, /wrapCanvasText\(ctx,edit\.text,boxWidth\)/);
  assert.match(exportHandler, /exportWarnings\.push/);
  assert.match(exportHandler, /exportWarnings\.length/);
  assert.match(exportHandler, /embedPng/);
});

test('Hindi font is loaded in the browser and original PDF bytes are not sent to a processing service', async () => {
  const js = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  const html = await readFile(new URL('../pdf-editor.html', import.meta.url), 'utf8');
  assert.match(html, /@pdf-lib\/fontkit@/);
  assert.match(js, /raw\.githubusercontent\.com\/notofonts\/noto-fonts/);
  assert.doesNotMatch(js, /fetch\([^)]*(?:workingBytes|finalBytes|pdfBytes)/);
  assert.match(js, /checked\.registerFontkit\(window\.fontkit\)/);
});
