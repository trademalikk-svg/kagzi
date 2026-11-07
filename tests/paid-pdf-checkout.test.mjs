import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');

test('paid library exposes a public catalogue before login', () => {
  const library = read('current-affairs/my-library.html');
  assert.match(library, /paid-library\.html/, 'signed-in library must link to the public paid PDF catalogue');
});

test('paid PDF records support server-verified payment orders', () => {
  const migration = read('supabase/migrations/20261107_paid_pdf_library.sql');
  assert.match(migration, /kagzi_payment_orders/, 'database must persist each payment order');
  assert.match(migration, /razorpay_order_id/, 'database must bind the gateway order to the KAGZI user and PDF');
});

test('paid PDF checkout never grants access from a browser-supplied success flag', () => {
  const migration = read('supabase/migrations/20261107_paid_pdf_library.sql');
  assert.match(migration, /payment_verified_at/, 'paid access must have a server-verified payment record');
  assert.match(migration, /kagzi_paid_entitlements/, 'verified purchases must grant the existing private-library entitlement');
});
