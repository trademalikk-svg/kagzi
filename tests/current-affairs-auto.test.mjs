import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');

test('automatic archive workflow is scheduled twice daily and manually runnable', () => {
  const workflow = read('.github/workflows/current-affairs-auto-update.yml');
  assert.ok(workflow.includes('30 1,13 * * *'));
  assert.ok(workflow.includes('workflow_dispatch:'));
  assert.ok(workflow.includes('python scripts/update_current_affairs.py'));
  assert.ok(workflow.includes('contents: write'));
});

test('archive viewer reads persisted official-source data and exposes all four periods', () => {
  const archive = read('current-affairs/archive.html');
  for (const view of ['daily','weekly','monthly','yearly']) {
    assert.ok(archive.includes('data-view="'+view+'"'));
    assert.ok(archive.includes('view='+view));
  }
  assert.ok(archive.includes('fetch("data/items.json"'));
  assert.ok(archive.includes('PIB Hindi RSS'));
  assert.ok(existsSync(new URL('scripts/update_current_affairs.py', root)));
});

test('Daily and Weekly are open archives while Monthly and Yearly remain paid-only', () => {
  assert.ok(read('current-affairs/day/index.html').includes('../archive.html?view=daily'));
  assert.ok(read('current-affairs/weekly/index.html').includes('../archive.html?view=weekly'));
  assert.ok(read('current-affairs/monthly/index.html').includes('MONTHLY · PAID ONLY'));
  assert.ok(read('current-affairs/yearly/index.html').includes('Yearly · Paid Only'));
  const archive = read('current-affairs/archive.html');
  assert.ok(archive.includes('params.get("view")==="monthly"'));
  assert.ok(archive.includes('params.get("view")==="yearly"'));
});

test('Hindi Daily and Weekly PDF builder consumes official PIB items and keeps stable latest links',()=>{
 const builder=read('scripts/build_current_affairs_pdfs.py');
 const helper=read('scripts/current_affairs_pdf_content.py');
 assert.match(builder,/build_pib_digest_fragment/);
 assert.match(builder,/KAGZI-Daily-Current-Affairs-Latest\.pdf/);
 assert.match(builder,/KAGZI-Weekly-Current-Affairs-Latest\.pdf/);
 assert.match(helper,/pib\.gov\.in/);
 assert.match(read('current-affairs/day/index.html'),/KAGZI-Daily-Current-Affairs-Latest\.pdf/);
 assert.match(read('current-affairs/weekly/index.html'),/KAGZI-Weekly-Current-Affairs-Latest\.pdf/);
});

test('automatic PIB workflow builds Hindi PDFs in the same successful archive run',()=>{
 const workflow=read('.github/workflows/current-affairs-auto-update.yml');
 assert.match(workflow,/python scripts\/update_current_affairs\.py/);
 assert.match(workflow,/python scripts\/build_current_affairs_pdfs\.py/);
 assert.match(workflow,/playwright install/);
 assert.match(workflow,/current-affairs\/day/);
 assert.match(workflow,/current-affairs\/weekly/);
});

test('PDF workflow builds branch preview on pull requests without pushing to main',()=>{
 const workflow=read('.github/workflows/current-affairs-pdfs.yml');
 assert.doesNotMatch(workflow,/ref: main/);
 assert.ok(workflow.includes("if: github.ref == 'refs/heads/main'"));
 assert.match(workflow,/scripts\/current_affairs_pdf_content\.py/);
});

test('Current Affairs PR verification builds real Hindi PDF previews',()=>{
 const workflow=read('.github/workflows/current-affairs-tests.yml');
 assert.match(workflow,/playwright install --with-deps chromium/);
 assert.match(workflow,/python scripts\/build_current_affairs_pdfs\.py/);
 assert.match(workflow,/contents: read/);
});
