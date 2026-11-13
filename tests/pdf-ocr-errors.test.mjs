import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

test('OCR errors explain first-use language-data network failures', async () => {
  const source = await readFile(new URL('../pdf-ocr.js', import.meta.url), 'utf8');
  const sandbox = { window: { Tesseract: { createWorker: async () => ({}) } }, document: {} };
  vm.runInNewContext(source, sandbox);
  assert.match(sandbox.window.KAGZIPdfOcrErrorMessage(new Error('Failed to fetch traineddata')), /Connect to the internet and retry/);
  assert.match(sandbox.window.KAGZIPdfOcrErrorMessage(new Error('worker wasm failed')), /Refresh the page and retry/);
  assert.equal(sandbox.window.KAGZIPdfOcrErrorMessage(new Error('bad input')), 'bad input');
});
