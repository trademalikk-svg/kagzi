import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (name) => readFileSync(new URL(name, root), 'utf8');
const index = read('index.html');
const modulesSource = read('modules.js');
const ids = new Set([...index.matchAll(/\bid=["']([^"']+)["']/g)].map((m) => m[1]));
const hrefs = [...index.matchAll(/href=["']#([^"']+)["']/g)].map((m) => m[1]);

test('dashboard fragment links resolve to real sections', () => {
  const missing = hrefs.filter((id) => !ids.has(id));
  assert.deepEqual(missing, [], 'Every in-page dashboard link must resolve');
});

test('module catalogue contains exactly 65 unique, named modules', () => {
  const match = modulesSource.match(/const modules=(\[[\s\S]*?\]);\s*\nconst list=/);
  assert.ok(match, 'Module catalogue declaration must be discoverable');
  const modules = JSON.parse(match[1]);
  assert.equal(modules.length, 65);
  assert.equal(new Set(modules.map((m) => m.id)).size, 65);
  for (const module of modules) {
    assert.ok(module.name && module.cat && module.desc, `Module ${module.id} needs name, category and description`);
  }
});

test('every module has an explicit and recognized availability status', () => {
  const match = modulesSource.match(/const modules=(\[[\s\S]*?\]);\s*\nconst list=/);
  const modules = JSON.parse(match[1]);
  const allowed = new Set(['available', 'in-development', 'coming-soon']);
  for (const module of modules) assert.ok(allowed.has(module.status), `${module.name} is missing a valid status`);
});

test('dashboard category links use the catalogue page rather than missing fragments', () => {
  for (const fragment of ['office', 'government', 'forms', 'locker', 'settings']) {
    assert.ok(!hrefs.includes(fragment), `Category link #${fragment} must not point to a missing section`);
  }
  assert.ok(index.includes('modules.html?category='));
});
