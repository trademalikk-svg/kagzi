import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../education.html', import.meta.url), 'utf8');
const reader = readFileSync(new URL('../reader.html', import.meta.url), 'utf8');
const admin = readFileSync(new URL('../admin-library.html', import.meta.url), 'utf8');

test('book cards expose an accessible detail dialog and internal reader route', () => {
  assert.match(html, /<button class="details-button"[^>]*data-details-id=/);
  assert.match(html, /<dialog id="bookDetails"/);
  assert.match(html, /reader\.html\?book=/);
});

test('public library reads only published records from KAGZI database', () => {
  assert.match(html, /from\('kagzi_library_files'\)/);
  assert.match(html, /eq\('is_published', true\)/);
  assert.match(html, /kagzi-supabase\.js/);
});

test('reader creates a short-lived URL for a private KAGZI storage object', () => {
  assert.match(reader, /createSignedUrl\(book\.storage_path,3600\)/);
  assert.match(reader, /eq\('is_published',true\)/);
  assert.doesNotMatch(reader, /target="_blank"/);
});

test('admin upload validates PDF and records rights details', () => {
  assert.match(admin, /accept="application\/pdf,\.pdf"/);
  assert.match(admin, /25\*1024\*1024/);
  assert.match(admin, /rights_reference/);
  assert.match(admin, /kagzi_library_admins/);
  assert.match(admin, /kagzi-library/);
});

test('Urdu is rendered right-to-left', () => {
  assert.match(html, /dir="rtl"/);
  assert.match(reader, /language==='ur'\?'rtl'/);
});
