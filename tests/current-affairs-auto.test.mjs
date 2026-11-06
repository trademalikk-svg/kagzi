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

test('all four folder pages route to their corresponding dynamic archive view', () => {
  for (const view of ['day','weekly','monthly','yearly']) {
    const page = read('current-affairs/'+view+'/index.html');
    const target = view === 'day' ? 'daily' : view;
    assert.ok(page.includes('../archive.html?view='+target));
  }
});
