import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (name) => readFileSync(new URL(name, root), 'utf8');
const index = read('index.html');
const script = read('script.js');

test('menu button is explicitly associated with the sidebar and starts closed', () => {
  const button = index.match(/<button\\b[^>]*id=["']menuBtn["'][^>]*>/)?.[0];
  assert.ok(button, 'The dashboard menu button must exist');
  assert.match(button, /aria-controls=["']sidebar["']/);
  assert.match(button, /aria-expanded=["']false["']/);
});

test('sidebar CSS keeps the drawer available and reveals it in the open state', () => {
  assert.match(index, /#sidebar\\s*\\{[^}]*display\\s*:\\s*flex\\s*!important/s);
  assert.match(index, /#sidebar\\.open\\s*\\{[^}]*transform\\s*:\\s*translateX\\(0\\)/s);
});

test('menu behavior synchronizes accessibility state and supports dismissal', () => {
  assert.match(script, /aria-expanded/);
  assert.match(script, /Escape/);
  assert.match(script, /closest\\(["']#sidebar["']\\)/);
  assert.match(script, /closest\\(["']a\\[href\\]["']\\)/);
});
