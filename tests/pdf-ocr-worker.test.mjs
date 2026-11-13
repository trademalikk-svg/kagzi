import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

test('OCR worker cache clears a failed initialization so the user can retry', async () => {
  const source = await readFile(new URL('../pdf-ocr.js', import.meta.url), 'utf8');
  let attempts = 0;
  const worker = { recognize: async () => ({ data: { text: 'नमस्ते', confidence: 96, words: [] } }) };
  const sandbox = {
    window: {
      Tesseract: {
        createWorker: async () => {
          attempts += 1;
          if (attempts === 1) throw new Error('language data download failed');
          return worker;
        }
      }
    },
    document: { getElementById: () => null, createElement: () => ({ getContext: () => ({}) }) }
  };
  vm.runInNewContext(source, sandbox);
  await assert.rejects(
    sandbox.window.KAGZIPdfOcrRecognize({}, 'hin', () => {}),
    /language data download failed/
  );
  const result = await sandbox.window.KAGZIPdfOcrRecognize({}, 'hin', () => {});
  assert.equal(result.text, 'नमस्ते');
  assert.equal(attempts, 2);
});

test('OCR worker initialization is shared by concurrent requests for the same language', async () => {
  const source = await readFile(new URL('../pdf-ocr.js', import.meta.url), 'utf8');
  let attempts = 0;
  const worker = { recognize: async () => ({ data: { text: 'test', confidence: 90, words: [] } }) };
  const sandbox = {
    window: {
      Tesseract: {
        createWorker: async () => {
          attempts += 1;
          await Promise.resolve();
          return worker;
        }
      }
    },
    document: { getElementById: () => null, createElement: () => ({ getContext: () => ({}) }) }
  };
  vm.runInNewContext(source, sandbox);
  await Promise.all([
    sandbox.window.KAGZIPdfOcrRecognize({}, 'eng', () => {}),
    sandbox.window.KAGZIPdfOcrRecognize({}, 'eng', () => {})
  ]);
  assert.equal(attempts, 1);
});
