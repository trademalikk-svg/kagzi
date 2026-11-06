import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (name) => readFile(new URL('../' + name, import.meta.url), 'utf8');

test('image editor puts the preview above editing controls on narrow screens', async () => {
  const css = await read('image-text-editor.css');
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*?\.editor-layout\s*\{[^}]*grid-template-columns:\s*minmax\(0,1fr\)/);
  assert.match(css, /\.canvas-area\s*\{[^}]*grid-row:\s*1/);
  assert.match(css, /\.side\s*\{[^}]*grid-row:\s*2/);
  assert.match(css, /\.side\s*\{[^}]*max-height:\s*none/);
});

test('PDF editor keeps thumbnails and tool controls horizontally usable on phones', async () => {
  const css = await read('pdf-editor.css');
  assert.match(css, /@media\s*\(max-width:\s*650px\)[\s\S]*?\.page-thumbnails\s*\{[^}]*overflow-x:\s*auto/);
  assert.match(css, /@media\s*\(max-width:\s*650px\)[\s\S]*?\.document-tools\s*\{[^}]*overflow-x:\s*auto/);
  assert.match(css, /\.document-tools\s+button\s*\{[^}]*min-height:\s*42px/);
  assert.match(css, /\.page-thumb\s*\{[^}]*flex:\s*0 0 76px/);
});

test('editor navigation and mobile controls expose touch-friendly targets', async () => {
  const image = await read('image-text-editor.html');
  const pdf = await read('pdf-editor.html');
  assert.match(image, /<nav[^>]*aria-label="[^"]+"/);
  assert.match(pdf, /<nav[^>]*aria-label="[^"]+"/);
  const imageCss = await read('image-text-editor.css');
  const pdfCss = await read('pdf-editor.css');
  assert.match(imageCss, /\.top\s+nav\s+a\s*\{[^}]*min-height:\s*42px/);
  assert.match(pdfCss, /\.editor-top\s+nav\s+a\s*\{[^}]*min-height:\s*42px/);
  assert.match(pdfCss, /\.scanner-actions\s+button[^}]*min-height:\s*42px/);
});
