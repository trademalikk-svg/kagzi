import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');
const [sharedCss, privateCss, jobsCss, privateHtml, privateJs, homepage, schemes] = await Promise.all([
  read('shared/cls-stability.css'),
  read('private-jobs.css'),
  read('government-jobs/assets/jobs-directory.css'),
  read('private-jobs.html'),
  read('private-jobs.js'),
  read('index.html'),
  read('government-schemes/index.html')
]);

test('homepage hero and service cards reserve stable dimensions', () => {
  assert.match(sharedCss, /\.vip-hero-grid[^{]*\{[^}]*min-height\s*:/s);
  assert.match(sharedCss, /@media\s*\(max-width:\s*760px\)[\s\S]*\.vip-hero-grid[^{]*\{[^}]*grid-template-rows/s);
  assert.match(sharedCss, /\.vip-service-grid[^{]*\{[^}]*grid-auto-rows\s*:/s);
  assert.match(sharedCss, /\.vip-service-grid\s*>\s*a[^{]*\{[^}]*min-height\s*:/s);
});

test('government job state directories reserve space before async data arrives', () => {
  assert.match(jobsCss, /body\[data-region\]\s+\.directory-section[^{]*\{[^}]*min-height\s*:/s);
  assert.match(jobsCss, /body\[data-region\].*\.directory-section\s*>\s*\.grid[^{]*\{[^}]*min-height\s*:/s);
});

test('private company directory reserves all 51 company slots while loading', () => {
  assert.match(privateHtml, /id="companySources"[^>]*aria-busy="true"/);
  assert.match(privateCss, /\.company-source-grid\[aria-busy="true"\][^{]*\{[^}]*repeat\(26,\s*minmax\(190px,\s*auto\)\)/s);
  assert.match(privateCss, /@media\s*\(max-width:\s*760px\)[\s\S]*\.company-source-grid\[aria-busy="true"\][^{]*\{[^}]*repeat\(51,\s*minmax\(190px,\s*auto\)\)/s);
  assert.match(privateJs, /container\.removeAttribute\(['"]aria-busy['"]\)/);
});

test('scheme AI controls use space reserved inside each card', () => {
  assert.match(sharedCss, /#schemeCards\s+\.scheme[^{]*\{[^}]*padding-bottom\s*:/s);
  assert.match(sharedCss, /\.scheme-ai-tools[^{]*\{[^}]*position\s*:\s*absolute/s);
});
