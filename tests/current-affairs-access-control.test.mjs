import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const admin=readFileSync(new URL('../current-affairs/admin.html',import.meta.url),'utf8');
const archive=readFileSync(new URL('../current-affairs/archive.html',import.meta.url),'utf8');
const migration=readFileSync(new URL('../supabase/migrations/20261107_current_affairs_access_control.sql',import.meta.url),'utf8');

test('Current Affairs settings require the explicit KAGZI admin allowlist',()=>{
 assert.match(admin,/from\(["']kagzi_library_admins["']\)/);
 assert.match(admin,/signInWithPassword/);
 assert.match(admin,/kagzi_current_affairs_access/);
 assert.match(migration,/Only KAGZI admins can update current affairs access/);
 assert.match(migration,/auth\.uid\(\)/);
});

test('Monthly and Yearly archives are hidden whenever their tier is not explicitly free',()=>{
 assert.match(archive,/supabase\.from\("kagzi_current_affairs_access"\)/);
 assert.match(archive,/params\.get\("view"\)==="monthly" \|\| params\.get\("view"\)==="yearly"/);
 assert.match(archive,/access\[view\]!=="free"/);
});

test('default tiers are Daily Free, Weekly Free, Monthly Paid and Yearly Paid',()=>{
 assert.match(migration,/\('daily','free'\),\('weekly','free'\),\('monthly','paid'\),\('yearly','paid'\)/);
});
