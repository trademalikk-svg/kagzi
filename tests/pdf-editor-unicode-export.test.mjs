import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Hindi text uses a browser-loaded Noto Devanagari font and shaped canvas export', async () => {
  const js = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  const html = await readFile(new URL('../pdf-editor.html', import.meta.url), 'utf8');
  assert.match(js, /new FontFace\('KAGZI Noto Sans Devanagari'/);
  assert.match(js, /await face\.load\(\)/);
  assert.match(js, /KAGZI Noto Sans Devanagari/);
  assert.match(js, /checked\.embedPng\(canvas\.toDataURL\('image\/png'\)\)/);
  assert.match(html, /Noto Sans Devanagari \(हिंदी\)/);
});

test('Hindi replacement clearly warns that the visual overlay is not searchable or secure deletion', async () => {
  const html = await readFile(new URL('../pdf-editor.html', import.meta.url), 'utf8');
  assert.match(html, /searchable\/selectable नहीं होगा/);
  assert.match(html, /secure redaction/);
});
