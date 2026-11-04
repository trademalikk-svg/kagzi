import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../education.html', import.meta.url), 'utf8');

test('book cards expose a real details button and an accessible details dialog', () => {
  assert.match(html, /<button class="details-button"[^>]*data-details-id="\$\{escapeHTML\(book\.id\)\}"/);
  assert.match(html, /<dialog id="bookDetails"/);
  assert.match(html, /id="bookDetailsTitle"/);
  assert.match(html, /reader\.html\?book=/);
});

test('Urdu book details support right-to-left and display rights information', () => {
  assert.match(html, /dir="rtl"/);
  assert.match(html, /rightsNote/);
});

test('book reading stays on KAGZI and the reader uses only local PDF paths', () => {
  const reader = readFileSync(new URL('../reader.html', import.meta.url), 'utf8');
  assert.match(html, /reader\.html\?book=/);
  assert.match(reader, /education-data\.mjs/);
  assert.match(reader, /book\.contentPath/);
  assert.doesNotMatch(reader, /target="_blank"|https?:\/\//);
});
