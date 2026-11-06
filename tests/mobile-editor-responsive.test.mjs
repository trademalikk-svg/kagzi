import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (name) => readFile(new URL('../' + name, import.meta.url), 'utf8');

test('image editor stacks preview before controls on narrow screens', async () => {
  const css = await read('image-text-editor.css');
  assert.match(css, /@media\s*\(max-width:\s*760px\)[\s\S]*?\.editor-layout\s*\{[^}]*grid-template-columns:\s*minmax\(0,1fr\)/);
  assert.match(css, /\.canvas-area\s*\{[^}]*order:\s*-1/);
  assert.match(css, /\.side\s*\{[^}]*max-height:\s*none/);
});

test('PDF editor keeps thumbnails and tool controls usable on phones', async () => {
  const css = await read('pdf-editor.css');
  assert.match(css, /@media\s*\(max-width:\s*650px\)[\s\S]*?\.page-thumbnails\s*\{[^}]*overflow-x:\s*auto/);
  assert.match(css, /@media\s*\(max-width:\s*650px\)[\s\S]*?\.document-tools\s*\{[^}]*overflow-x:\s*auto/);
  assert.match(css, /\.document-tools\s+button\s*\{[^}]*min-height:\s*40px/);
});

test('editor navigation exposes labelled, touch-friendly links on small screens', async () => {
  const image = await read('image-text-editor.html');
  const pdf = await read('pdf-editor.html');
  assert.match(image, /<nav[^>]*aria-label="[^"]+"/);
  assert.match(pdf, /<nav[^>]*aria-label="[^"]+"/);
  const css = await read('image-text-editor.css');
  assert.match(css, /\.top\s+nav\s+a\s*\{[^}]*min-height:\s*40px/);
});
