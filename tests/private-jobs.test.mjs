import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

test('public Private Jobs page is searchable without requiring login', () => {
  const page = read('private-jobs.html');
  assert.match(page, /<title>[^<]*Private Jobs/i);
  assert.match(page, /name="description"/i);
  assert.doesNotMatch(page, /data-kagzi-protected="true"/i);
  for (const id of ['jobSearch', 'regionFilter', 'experienceFilter', 'qualificationFilter', 'salaryFilter', 'jobsList']) {
    assert.match(page, new RegExp('id="' + id + '"'));
  }
  assert.match(page, /supabase-js@2/);
  assert.match(page, /kagzi_private_jobs/);
  assert.match(page, /Official Apply/i);
});

test('Private Jobs page distinguishes official, estimated and undisclosed income', () => {
  const page = read('private-jobs.html');
  for (const phrase of ['Monthly Salary', 'Annual CTC', 'In-hand', 'Estimated', 'Not Disclosed', 'Internship Stipend']) {
    assert.ok(page.toLowerCase().includes(phrase.toLowerCase()), 'missing salary label: ' + phrase);
  }
});

test('Private Jobs admin requires a session and explicit KAGZI admin allowlist', () => {
  const page = read('private-jobs-admin.html');
  assert.match(page, /data-kagzi-protected="true"/);
  assert.match(page, /signInWithPassword/);
  assert.match(page, /kagzi_library_admins/);
  assert.match(page, /kagzi_private_jobs/);
  assert.match(page, /kagzi_private_job_sources/);
  for (const id of ['companyName', 'jobTitle', 'qualification', 'experienceLevel', 'applicationUrl', 'sourceUrl', 'lastDate', 'salaryDisclosure', 'publishJob']) {
    assert.match(page, new RegExp('id="' + id + '"'));
  }
});

test('Private Jobs migration grants public read only to verified published records', () => {
  const sql = read('supabase/migrations/20261107_private_jobs.sql');
  assert.match(sql, /create table if not exists public\.kagzi_private_jobs/i);
  assert.match(sql, /create table if not exists public\.kagzi_private_job_sources/i);
  assert.match(sql, /alter table public\.kagzi_private_jobs enable row level security/i);
  assert.match(sql, /alter table public\.kagzi_private_job_sources enable row level security/i);
  assert.match(sql, /grant select on public\.kagzi_private_jobs to anon/i);
  assert.match(sql, /verification_status = 'verified'/i);
  assert.match(sql, /is_published = true/i);
  assert.match(sql, /kagzi_library_admins/i);
  assert.match(sql, /salary_disclosure/i);
  assert.match(sql, /annual_ctc_min_inr/i);
  assert.match(sql, /in_hand_min_inr/i);
  assert.match(sql, /source_permission_status/i);
  assert.match(sql, /revoke all on public\.kagzi_private_job_sources from anon, authenticated/i);
});

test('public jobs route remains public while admin route is protected', () => {
  const publicPage = read('private-jobs.html');
  const adminPage = read('private-jobs-admin.html');
  const protectedPages = JSON.parse(read('.github/kagzi-html-pages.json'));
  assert.doesNotMatch(publicPage, /data-kagzi-protected="true"/i);
  assert.match(adminPage, /data-kagzi-protected="true"/i);
  assert.ok(protectedPages.includes('private-jobs-admin.html'));
});
