import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = async (path) => readFile(new URL(path, root), 'utf8');

test('bilingual SEO landing pages expose unique metadata and reciprocal hreflang', async () => {
  const pairs = [
    ['education-pdfs.html', 'education-pdfs-en.html'],
    ['jan-seva.html', 'jan-seva-en.html'],
    ['document-editing.html', 'document-editing-en.html'],
  ];
  for (const [hiPath, enPath] of pairs) {
    const [hi, en] = await Promise.all([read(hiPath), read(enPath)]);
    for (const html of [hi, en]) {
      assert.ok(html.includes('<title>'));
      assert.ok(html.includes('<meta name="description"'));
      assert.ok(html.includes('rel="canonical"'));
      assert.ok(html.includes('hreflang="hi-IN"'));
      assert.ok(html.includes('hreflang="en-IN"'));
      assert.ok(html.includes('name="robots" content="index,follow'));
    }
    assert.ok(hi.includes(enPath.replace('.html', '')));
    assert.ok(en.includes(hiPath.replace('.html', '')));
  }
});

test('public sitemap includes new landing pages and subject books', async () => {
  const sitemap = await read('sitemap.xml');
  assert.ok(sitemap.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(sitemap.trim().endsWith('</urlset>'));
  for (const path of [
    'education-pdfs', 'education-pdfs-en', 'jan-seva-en',
    'document-editing', 'document-editing-en',
    'history-book', 'geography-book', 'up-gk-book',
    'economy-book', 'science-book', 'environment-book',
    'math-reasoning-book', 'hindi-book', 'mcq-pyq-book',
    'study-material/english/'
  ]) assert.ok(sitemap.includes('https://kagzi-8cy.pages.dev/' + path), path);
});

test('authenticated Document Studio is excluded from indexing', async () => {
  const html = await read('document-studio.html');
  assert.ok(html.includes('<meta name="robots" content="noindex,follow">'));
});
