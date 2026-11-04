import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../education.html', import.meta.url), 'utf8');

test('book cards expose a details action and an accessible details dialog', () => {
  assert.match(html, /data-details-id/);
  assert.match(html, /<dialog id="bookDetails"/);
  assert.match(html, /id="bookDetailsTitle"/);
  assert.match(html, /id="bookDetailsSource"/);
});

test('Urdu book details can be rendered right-to-left', () => {
  assert.match(html, /dir="rtl"/);
  assert.match(html, /rightsNote/);
});
