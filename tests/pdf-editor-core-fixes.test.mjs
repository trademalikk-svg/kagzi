import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Hindi text tool uses shaped canvas image placement and grapheme-safe wrapping', async () => {
  const js = await read('pdf-editor.js');
  assert.match(js, /Intl\.Segmenter\(\s*'hi'/);
  assert.match(js, /async function drawUnicodeTextImage/);
  assert.match(js, /if\(\/\[\\u0900-\\u097F\]\//);
  assert.match(js, /drawUnicodeTextImage\(pdf,page,value/);
  assert.match(js, /page\.drawImage\(image,\{x,y,width:boxWidth,height:boxHeight\}\)/);
});

test('native PDFium replacement is loaded and guarded by exact-match verification', async () => {
  const html = await read('pdf-editor.html');
  const js = await read('pdf-editor.js');
  assert.match(html, /src="\/assets\/kagzi-pdfium-native\.js"/);
  assert.match(html, /src="pdfium-native-text-engine\.js"/);
  assert.match(html, /src="pdf-native-text-gate\.js"/);
  assert.match(html, /id="nativeEditText"/);
  assert.match(js, /gate\.replaceText\(/);
  assert.match(js, /Save\/Reopen verification/);
});

test('Hindi and English OCR is the default and full recognized line breaks are preserved', async () => {
  const html = await read('pdf-editor.html');
  const ocr = await read('pdf-ocr.js');
  assert.match(html, /<option value="hin\+eng" selected>Hindi \+ English \(Default\)<\/option>/);
  assert.match(ocr, /value\|\|'hin\+eng'/);
  assert.match(ocr, /return result\.text\?\[\{text:result\.text/);
});

test('PDF loading protects working bytes and export reopens the saved document', async () => {
  const js = await read('pdf-editor.js');
  assert.match(js, /getDocument\(\{data:bytes\.slice\(\)\}\)/);
  assert.match(js, /PDFDocument\.load\(finalBytes\.slice\(\)\)/);
  assert.match(js, /Export verification failed/);
});

test('mobile layout places the PDF workspace before the properties inspector', async () => {
  const css = await read('pdf-editor.css');
  assert.match(css, /\.document-area\{grid-row:2/);
  assert.match(css, /\.pdf-inspector\{grid-row:3/);
  assert.match(css, /@media\(min-width:651px\) and \(max-width:1000px\)/);
});
