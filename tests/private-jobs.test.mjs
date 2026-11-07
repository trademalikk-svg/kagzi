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
  const script = read('private-jobs.js');
  assert.match(script, /kagzi_private_jobs/);
  assert.match(script, /Official Apply/i);
});

test('Private Jobs page distinguishes official, estimated and undisclosed income', () => {
  const page = read('private-jobs.html') + read('private-jobs.js');
  for (const phrase of ['Monthly Salary', 'Annual CTC', 'In-hand', 'Estimated', 'Not Disclosed', 'Internship Stipend']) {
    assert.ok(page.toLowerCase().includes(phrase.toLowerCase()), 'missing salary label: ' + phrase);
  }
});

test('Private Jobs admin requires a session and explicit KAGZI admin allowlist', () => {
  const page = read('private-jobs-admin.html');
  assert.doesNotMatch(page, /data-kagzi-protected="true"/);
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
  assert.match(sql, /verification_status in \('verified','expired'\)/i);
  assert.match(sql, /is_published = true/i);
  assert.match(sql, /kagzi_library_admins/i);
  assert.match(sql, /salary_disclosure/i);
  assert.match(sql, /annual_ctc_min_inr/i);
  assert.match(sql, /in_hand_min_inr/i);
  assert.match(sql, /source_permission_status/i);
  assert.match(sql, /minimum_age integer check \(minimum_age is null or minimum_age >= 18\)/i);
  assert.match(sql, /revoke all on public\.kagzi_private_job_sources from anon, authenticated/i);
});

test('public jobs route and admin login entry are public while admin data is allowlist protected', () => {
  const publicPage = read('private-jobs.html');
  const adminPage = read('private-jobs-admin.html');
  const protectedPages = JSON.parse(read('.github/kagzi-html-pages.json'));
  assert.doesNotMatch(publicPage, /data-kagzi-protected="true"/i);
  assert.doesNotMatch(adminPage, /data-kagzi-protected="true"/i);
  assert.ok(!protectedPages.includes('private-jobs-admin.html'));
});

test('admin can close a job without deleting its audit record', () => {
  const page = read('private-jobs-admin.html');
  assert.match(page, /Close Job/);
  assert.match(page, /verification_status:\s*'withheld'/);
  assert.match(page, /is_published:\s*false/);
});

test('homepage links to the separate Private Jobs directory', () => {
  const home = read('index.html');
  assert.match(home, /href="private-jobs.html">Private Jobs/);
  assert.match(home, /FIND PRIVATE JOBS/);
});

test('migration seeds 50 official company career sources for manual permission review', () => {
  const sql = read('supabase/migrations/20261107_private_jobs.sql');
  const seed = sql.split('-- Curated official career-page directory (50 companies). All remain pending permission review.')[1] || '';
  const rows = seed.match(/^  \('/gm) || [];
  assert.equal(rows.length, 50);
  assert.match(seed, /'pending_review',false,false,true,'manual',true/);
  assert.match(seed, /on conflict \(careers_url\) do nothing/i);
});

test('public page lists 50 official career portal links without claiming vacancies', () => {
  const page = read('private-jobs.html');
  const sources = JSON.parse(read('private-job-sources.json'));
  assert.equal(sources.length, 50);
  assert.match(page, /50 Company Career Portals/);
  assert.match(page, /id="companySources"/);
  for (const source of sources) {
    assert.ok(source.company && source.sector);
    assert.equal(new URL(source.url).protocol, 'https:');
  }
});

test('policy tuning migration keeps one combined select policy and indexes admin foreign keys', () => {
  const sql = read('supabase/migrations/20261107_private_jobs_policy_tuning.sql');
  assert.match(sql, /create policy "View permitted private jobs and admin records"/i);
  assert.match(sql, /create policy "KAGZI admins insert private jobs"/i);
  assert.match(sql, /create policy "KAGZI admins update private jobs"/i);
  assert.match(sql, /create policy "KAGZI admins delete private jobs"/i);
  assert.match(sql, /kagzi_private_jobs_created_by_idx/);
  assert.match(sql, /kagzi_private_job_sources_created_by_idx/);
});

test('link-only factual job records may be published with original summaries and direct official links', () => {
  const sql = read('supabase/migrations/20261107_private_jobs_live_listing.sql');
  assert.match(sql, /source_permission_status in \\('link_only','licensed','written_permission'\\)/i);
  assert.match(sql, /Senior Associate - Identity and Access Management/);
  assert.match(sql, /careers\\.npci\\.org\\.in/);
  assert.match(sql, /is_published = true/);
  const admin = read('private-jobs-admin.html');
  assert.match(admin, /link_only/);
  assert.match(admin, /company description copy न करें/);
});

test('official NPCI career page is included in the public company directory', () => {
  const sources = JSON.parse(read('private-job-sources.json'));
  assert.ok(sources.some(source => source.company === 'NPCI' && source.url.includes('careers.npci.org.in')));
});
