import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');

test('article admin is protected, noindex, and checks the existing KAGZI library-admin allowlist', () => {
  const page = read('article-admin.html');
  assert.match(page, /data-kagzi-protected="true"/);
  assert.match(page, /noindex,nofollow/);
  assert.match(page, /kagzi_library_admins/);
  assert.match(page, /auth\.getUser\(\)/);
});

test('article drafts are isolated by RLS and only published rows are public', () => {
  const migration = read('supabase/migrations/20261109120000_kagzi_article_approval.sql');
  assert.match(migration, /create table if not exists public\.kagzi_articles/i);
  assert.match(migration, /enable row level security/i);
  assert.match(migration, /status = 'published'/i);
  assert.match(migration, /kagzi_library_admins/i);
  assert.match(migration, /grant select on public\.kagzi_articles to anon, authenticated/i);
});

test('approval and publication are explicit separate admin actions', () => {
  const page = read('article-admin.html');
  assert.match(page, /Approve for publishing/);
  assert.match(page, /Publish now/);
  assert.match(page, /pending_review/);
  assert.match(page, /published/);
  assert.match(page, /source_urls/);
});

test('public article index only renders published articles and has a matching reader route', () => {
  const index = read('articles/index.html');
  const reader = read('article.html');
  assert.match(index, /status.*published|published.*status/);
  assert.match(reader, /status.*published|published.*status/);
  assert.ok(existsSync(new URL('articles/index.html', root)));
  assert.ok(existsSync(new URL('article.html', root)));
});

test('existing Current Affairs archive remains untouched by article publishing', () => {
  const workflow = read('.github/workflows/current-affairs-auto-update.yml');
  assert.match(workflow, /current-affairs\/data\/items\.json/);
  assert.match(workflow, /current-affairs\/day/);
  assert.match(workflow, /current-affairs\/weekly/);
});
