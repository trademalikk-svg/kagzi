import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Hindi text uses a browser-loaded Noto Devanagari font and shaped canvas export', async () => {
  const js = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  const html = await readFile(new URL('../pdf-editor.html', import.meta.url), 'utf8');
  assert.match(js, /new FontFace\\('KAGZI Noto Sans Devanagari'/);
  assert.match(js, /await face\\.load\\(\\)/);
  assert.match(js, /KAGZI Noto Sans Devanagari/);
  assert.match(js, /checked\\.embedPng\\(canvas\\.toDataURL\\('image\\/png'\\)\\)/);
  assert.match(html, /Noto Sans Devanagari \\(हिंदी\\)/);
});

test('native text replacement and visual overlay are clearly distinguished', async () => {
  const html = await readFile(new URL('../pdf-editor.html', import.meta.url), 'utf8');
  assert.match(html, /Replace original PDF text/);
  assert.match(html, /Apply visual overlay/);
  assert.match(html, /पुराने embedded text को नहीं हटाता/);
  assert.match(html, /secure-redaction tool|secure redaction/);
});
