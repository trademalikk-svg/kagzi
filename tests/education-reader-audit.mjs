import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../education.html', import.meta.url), 'utf8');

test('book cards expose a real details button and an accessible details dialog', () => {
  assert.match(html, /<button class="details-button"[^>]*data-details-id="\$\{escapeHTML\(book\.id\)\}"/);
  assert.match(html, /<dialog id="bookDetails"/);
  assert.match(html, /id="bookDetailsTitle"/);
  assert.match(html, /id="bookDetailsSource"/);
});

test('Urdu book details support right-to-left and display rights information', () => {
  assert.match(html, /dir="rtl"/);
  assert.match(html, /rightsNote/);
});
