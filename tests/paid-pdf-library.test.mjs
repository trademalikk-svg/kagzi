import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const page = readFileSync(new URL('../current-affairs/my-library.html', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../supabase/migrations/20261107_paid_pdf_library.sql', import.meta.url), 'utf8');
test('paid library requires a signed-in user', () => {
  assert.match(page, /supabase\.auth\.getUser\(\)/);
  assert.match(page, /auth\.html\?redirect=current-affairs\/my-library\.html/);
});
test('paid downloads request short-lived signed URLs from the server after entitlement verification', () => {
  assert.match(page, /fetch\("\/api\/payments\/download"/);
  assert.match(page, /resource_id:resource\.id/);
  assert.doesNotMatch(page, /storage_path/);
  assert.match(migration, /values \('kagzi-paid-pdfs','kagzi-paid-pdfs',false/);
});
test('entitlement RLS limits rows to the authenticated owner', () => {
  assert.match(migration, /user_id=\(select auth\.uid\(\)\)/);
  assert.match(migration, /Paid PDF owners can download entitled resources/);
  assert.match(migration, /e\.status='active'/);
});
test('only KAGZI admins can grant or manage access', () => {
  assert.match(migration, /KAGZI admins manage paid entitlements/);
  assert.match(migration, /kagzi_library_admins/);
});
