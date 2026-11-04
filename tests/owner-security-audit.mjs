import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const authHtml = readFileSync(new URL('auth.html', root), 'utf8');
const authJs = readFileSync(new URL('auth.js', root), 'utf8');
const adminHtml = readFileSync(new URL('admin-library.html', root), 'utf8');

test('existing email and password login remains available for all users', () => {
  assert.match(authHtml, /id="authEmail"/);
  assert.match(authHtml, /id="authPassword"/);
  assert.match(authJs, /signInWithPassword/);
  assert.match(authJs, /signUp/);
});

test('owner passkey is opt-in and checked against server-managed admin membership', () => {
  assert.match(adminHtml, /signInWithPasskey/);
  assert.match(adminHtml, /kagzi_library_admins/);
  assert.match(adminHtml, /Owner Passkey/);
  assert.match(adminHtml, /experimental:\s*\{\s*passkey:\s*true/);
});

test('owner ID login requires password and a verified TOTP challenge', () => {
  assert.match(adminHtml, /Owner ID/);
  assert.match(adminHtml, /signInWithPassword/);
  assert.match(adminHtml, /challenge\(/);
  assert.match(adminHtml, /verify\(/);
  assert.match(adminHtml, /factorType:\s*['"]totp['"]/);
});

test('owner recovery exposes email recovery and backup codes without weakening normal login', () => {
  assert.match(adminHtml, /resetPasswordForEmail/);
  assert.match(adminHtml, /backup recovery codes/i);
  assert.match(adminHtml, /recovery code/i);
});

test('admin access is denied and session cleared for non-admin accounts', () => {
  assert.match(adminHtml, /kagzi_library_admins/);
  assert.match(adminHtml, /signOut/);
  assert.match(adminHtml, /not authorized|अनुमति नहीं/i);
});
