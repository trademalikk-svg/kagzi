import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (name) => readFileSync(new URL(name, root), 'utf8');
const index = read('index.html');
const modulesSource = read('modules.js');
const ids = [...index.matchAll(/\bid=["']([^"']+)["']/g)].map((m) => m[1]);
const idSet = new Set(ids);
const hrefs = [...index.matchAll(/href=["']#([^"']+)["']/g)].map((m) => m[1]);

test('dashboard fragment links resolve and IDs are unique', () => {
  assert.equal(idSet.size, ids.length, 'Dashboard element IDs must be unique');
  const missing = hrefs.filter((id) => !idSet.has(id));
  assert.deepEqual(missing, [], 'Every in-page dashboard link must resolve');
});

test('module catalogue contains exactly 65 unique, named modules', () => {
  const match = modulesSource.match(/const modules=(\[[\s\S]*?\]);[\s\S]*?const moduleDestinations=/);
  assert.ok(match, 'Module catalogue declaration must be discoverable');
  const modules = JSON.parse(match[1]);
  assert.equal(modules.length, 65);
  assert.equal(new Set(modules.map((m) => m.id)).size, 65);
  for (const module of modules) {
    assert.ok(module.name && module.cat && module.desc, `Module ${module.id} needs name, category and description`);
  }
});

test('all 65 modules are assigned an explicit availability state', () => {
  const destinationBlock = modulesSource.match(/const moduleDestinations=\{([^}]+)\}/);
  const developmentBlock = modulesSource.match(/const inDevelopmentModuleIds=new Set\(\[([^\]]*)\]\)/);
  assert.ok(destinationBlock && developmentBlock, 'Availability maps must be declared');
  const available = [...destinationBlock[1].matchAll(/(\d+):/g)].map((m) => Number(m[1]));
  const development = [...developmentBlock[1].matchAll(/\d+/g)].map((m) => Number(m[0]));
  const assigned = new Set([...available, ...development]);
  assert.equal(available.length, new Set(available).size, 'Available module IDs must be unique');
  assert.equal(development.length, new Set(development).size, 'Development module IDs must be unique');
  assert.equal(assigned.size, 65, 'Every module ID must be classified as available, in development, or coming soon');
  assert.match(modulesSource, /m\.status=availableModuleIds\.has\(m\.id\)\?'available':inDevelopmentModuleIds\.has\(m\.id\)\?'in-development':'coming-soon'/);
});

test('dashboard category cards no longer point to missing section IDs', () => {
  for (const fragment of ['office', 'government', 'forms', 'locker', 'settings', 'all-tools']) {
    assert.ok(!hrefs.includes(fragment), `Category link #${fragment} must not point to a missing section`);
  }
  assert.ok(index.includes('modules.html?category='));
});
