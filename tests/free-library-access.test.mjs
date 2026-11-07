import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const publicPages = [
  'education.html',
  'study-material.html',
  'history-book.html',
  'geography-book.html',
  'up-gk-book.html',
  'economy-book.html',
  'science-book.html',
  'environment-book.html',
  'math-reasoning-book.html',
  'hindi-book.html',
  'mcq-pyq-book.html',
  'current-affairs/index.html',
  'current-affairs/day/index.html',
  'current-affairs/weekly/index.html',
  'current-affairs/monthly/index.html',
  'current-affairs/yearly/index.html',
  'current-affairs/english/index.html',
  'current-affairs/archive.html'
];

test('free education and Current Affairs pages open without a login gate', () => {
  for (const path of publicPages) {
    assert.doesNotMatch(read(path), /data-kagzi-protected=["']true["']/, path + ' must be public');
  }
});

test('paid library and admin tools remain behind account protection', () => {
  assert.match(read('current-affairs/my-library.html'), /data-kagzi-protected=["']true["']/);
  assert.match(read('current-affairs/admin.html'), /data-kagzi-protected=["']true["']/);
});

test('all nine Hindi study PDFs remain directly linked from the free catalogue', () => {
  const catalogue = read('study-material.html');
  for (const name of [
    'KAGZI-History.pdf', 'KAGZI-Geography.pdf', 'KAGZI-UP-GK.pdf',
    'KAGZI-Economy.pdf', 'KAGZI-Science.pdf', 'KAGZI-Environment.pdf',
    'KAGZI-Maths-Reasoning.pdf', 'KAGZI-Hindi.pdf', 'KAGZI-MCQ-PYQ.pdf'
  ]) assert.ok(catalogue.includes(name), 'missing free PDF link: ' + name);
});
