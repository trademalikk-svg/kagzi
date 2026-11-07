import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hmacHex, verifyHmacHex, capturedPaymentMatches } from '../functions/api/payments/_shared.js';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');

test('paid library exposes a public catalogue before login', () => {
  const library = read('current-affairs/my-library.html');
  const catalogue = read('paid-library.html');
  assert.match(library, /paid-library\.html/, 'signed-in library must link to the public paid PDF catalogue');
  assert.doesNotMatch(catalogue, /data-kagzi-protected=["']true["']/);
  assert.match(catalogue, /auth\.html\?mode=login&redirect=/);
});

test('paid PDF records support server-verified payment orders', () => {
  const migration = read('supabase/migrations/20261108_paid_pdf_checkout.sql');
  assert.match(migration, /kagzi_payment_orders/);
  assert.match(migration, /razorpay_order_id/);
  assert.match(migration, /payment_verified_at/);
  assert.match(migration, /user_id = \(select auth\.uid\(\)\)/);
});

test('private storage paths are not readable by public catalogue clients', () => {
  const migration = read('supabase/migrations/20261108_paid_pdf_checkout.sql');
  const catalogue = read('paid-library.html');
  const library = read('current-affairs/my-library.html');
  assert.match(migration, /revoke select on public\.kagzi_paid_resources from anon, authenticated/);
  assert.match(migration, /grant select \(id,title,description,price_inr,is_active,created_at,updated_at\)/);
  assert.doesNotMatch(catalogue, /storage_path/);
  assert.doesNotMatch(library, /storage_path/);
});

test('checkout verifies Razorpay HMAC and captured order amount before entitlement grant', () => {
  const verify = read('functions/api/payments/verify.js');
  const shared = read('functions/api/payments/_shared.js');
  assert.match(verify, /verifyHmacHex/);
  assert.match(verify, /capturedPaymentMatches/);
  assert.match(verify, /settlePaidOrder/);
  assert.match(shared, /payment\.status === "captured"/);
  assert.match(shared, /payment\.amount === order\.amount_inr \* 100/);
});

test('private PDF download checks the signed-in owner entitlement on the server', () => {
  const download = read('functions/api/payments/download.js');
  assert.match(download, /authenticatedUser/);
  assert.match(download, /kagzi_paid_entitlements/);
  assert.match(download, /user_id: "eq\." \+ user\.id/);
  assert.match(download, /storage\/v1\/object\/sign/);
});

test('Razorpay webhook requires a valid signature and captured payment event', () => {
  const webhook = read('functions/api/payments/webhook.js');
  assert.match(webhook, /x-razorpay-signature/);
  assert.match(webhook, /verifyHmacHex/);
  assert.match(webhook, /payment\.captured/);
  assert.match(webhook, /payment\.amount !== order\.amount_inr \* 100/);
});

test('email confirmation preserves the requested paid catalogue return path', () => {
  const auth = read('auth.js');
  assert.match(auth, /emailRedirectTo:location\.origin\+'\/auth\.html\?mode=login&redirect='\+encodeURIComponent\(safeRedirect\)/);
});

test('Razorpay signatures are checked cryptographically and mismatches are rejected', async () => {
  const secret = 'test-only-secret';
  const message = 'order_test123|pay_test123';
  const signature = await hmacHex(secret, message);
  assert.equal(await verifyHmacHex(secret, message, signature), true);
  assert.equal(await verifyHmacHex(secret, message + 'x', signature), false);
  assert.equal(await verifyHmacHex(secret, message, '0'.repeat(64)), false);
});

test('captured payment must match gateway order id, currency and exact amount', () => {
  const order = { razorpay_order_id: 'order_test123', amount_inr: 25, currency: 'INR' };
  assert.equal(capturedPaymentMatches({status:'captured',order_id:'order_test123',currency:'INR',amount:2500},order),true);
  assert.equal(capturedPaymentMatches({status:'authorized',order_id:'order_test123',currency:'INR',amount:2500},order),false);
  assert.equal(capturedPaymentMatches({status:'captured',order_id:'order_other',currency:'INR',amount:2500},order),false);
  assert.equal(capturedPaymentMatches({status:'captured',order_id:'order_test123',currency:'INR',amount:2499},order),false);
});
