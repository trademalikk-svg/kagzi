import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');

test('English Current Affairs exposes separate Daily, Weekly, Monthly and Yearly sections', () => {
  const home = read('current-affairs/english/index.html');
  for (const path of ['day/', 'weekly/', 'monthly/', 'yearly/']) assert.ok(home.includes(path), 'missing English folder link: ' + path);
});

test('English Monthly and Yearly editions remain paid-only without free PDF samples', () => {
  const monthly = read('current-affairs/english/monthly/index.html');
  const yearly = read('current-affairs/english/yearly/index.html');
  for (const [name, page] of [['monthly', monthly], ['yearly', yearly]]) {
    assert.match(page, /PAID ONLY/);
    assert.match(page, /No free PDF or free sample is offered/);
    assert.match(page, /private storage/);
    assert.doesNotMatch(page, /href=["'][^"']+\.pdf/i, name + ' page must not expose a PDF before final publication');
  }
});

test('English Monthly and Yearly pages do not claim incomplete periods are final', () => {
  assert.match(read('current-affairs/english/monthly/index.html'), /still being compiled/);
  assert.match(read('current-affairs/english/yearly/index.html'), /after the year ends/);
});
