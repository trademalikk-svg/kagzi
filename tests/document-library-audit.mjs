import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const html = readFileSync(new URL('document-library.html', root), 'utf8');

test('document library has no fake sample documents', () => {
  assert.doesNotMatch(html, /const sample\s*=\s*\[/);
  assert.doesNotMatch(html, /Sample library|Sample listing/);
});

test('published KAGZI resources come from the published database catalogue', () => {
  assert.match(html, /from\(['"]kagzi_library_files['"]\)/);
  assert.match(html, /is_published/);
  assert.match(html, /kagzi-library/);
});

test('private documents and public catalogue are separate sections', () => {
  assert.match(html, /My Documents|My Library/);
  assert.match(html, /KAGZI Resources|Explore documents/);
  assert.match(html, /kagzi_documents/);
});

test('signed-out, loading, empty and error states are explicit', () => {
  for (const state of ['Loading', 'Login required', 'No uploaded documents', 'failed', 'No resources']) {
    assert.match(html, new RegExp(state, 'i'));
  }
});

test('upload is PDF-only, bounded, owner-prefixed and separate from preview', () => {
  assert.match(html, /accept=["']application\/pdf/);
  assert.match(html, /50\s*\*\s*1024\s*\*\s*1024/);
  assert.match(html, /currentUser\.id\s*\+\s*["']\//);
  assert.match(html, /createObjectURL/);
  assert.match(html, /Upload to My Library/);
});

test('private read and download use expiring signed URLs', () => {
  assert.match(html, /createSignedUrl/);
  assert.match(html, /download/);
  assert.match(html, /300/);
});

test('deletion requires confirmation and reports partial failures', () => {
  assert.match(html, /confirm\(/);
  assert.match(html, /remove\(/);
  assert.match(html, /partial|partially|retry/i);
});

test('payment choices are visible but cannot initiate a transaction', () => {
  const homepage = readFileSync(new URL('index.html', root), 'utf8');
  assert.match(homepage, /PAYMENT COMING SOON/);
  assert.match(homepage, /अभी उपलब्ध नहीं/);
  assert.doesNotMatch(homepage, /razorpay|checkout\.com|createOrder/i);
});
