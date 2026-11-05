import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

function loadOcr(createWorker) {
  const window = { Tesseract: { createWorker } };
  const document = {
    getElementById: () => null,
    createElement: () => ({
      getContext: () => ({}),
      getBoundingClientRect: () => ({ width: 100, height: 100 })
    })
  };
  vm.runInNewContext(source, { window, document });
  return window;
}
const source = await readFile(new URL('../pdf-ocr.js', import.meta.url), 'utf8');

test('OCR engine reuses a worker per language and returns normalized text and word data', async () => {
  const created = [];
  const worker = { recognize: async () => ({ data: { text: 'नमस्ते world', confidence: 91, words: [{ text: 'नमस्ते', confidence: 95, bbox: { x0: 1, y0: 2, x1: 3, y1: 4 } }] } }) };
  const window = loadOcr(async (language, oem, options) => {
    created.push({ language, oem, options });
    return worker;
  });
  const first = await window.KAGZIPdfOcrRecognize({ name: 'scan.jpg' }, 'hin+eng', () => {});
  const second = await window.KAGZIPdfOcrRecognize({ name: 'scan2.jpg' }, 'hin+eng', () => {});
  assert.equal(created.length, 1);
  assert.equal(created[0].language, 'hin+eng');
  assert.equal(first.text, 'नमस्ते world');
  assert.equal(first.confidence, 91);
  assert.equal(first.words[0].text, 'नमस्ते');
  assert.equal(second.text, first.text);
});

test('OCR worker creation failures are not cached permanently and can be retried', async () => {
  let attempts = 0;
  const worker = { recognize: async () => ({ data: { text: 'retry worked', confidence: 80, words: [] } }) };
  const window = loadOcr(async () => {
    attempts += 1;
    if (attempts === 1) throw new Error('language data offline');
    return worker;
  });
  await assert.rejects(window.KAGZIPdfOcrRecognize({}, 'urd', () => {}), /language data offline/);
  const result = await window.KAGZIPdfOcrRecognize({}, 'urd', () => {});
  assert.equal(attempts, 2);
  assert.equal(result.text, 'retry worked');
});

test('OCR progress reports a bounded integer percentage', async () => {
  let logger;
  const window = loadOcr(async (language, oem, options) => {
    logger = options.logger;
    return { recognize: async () => {
      logger({ status: 'recognizing text', progress: 0.57 });
      logger({ status: 'recognizing text', progress: 1.5 });
      return { data: { text: 'done', confidence: 100, words: [] } };
    } };
  });
  const progress = [];
  await window.KAGZIPdfOcrRecognize({}, 'eng', value => progress.push(value));
  assert.deepEqual(progress, [57, 100]);
});

test('OCR language selector offers individual Hindi, English and Urdu plus a combined choice', async () => {
  const html = await readFile(new URL('../pdf-editor.html', import.meta.url), 'utf8');
  for (const code of ['eng', 'hin', 'urd', 'eng+hin']) {
    assert.match(html, new RegExp('value="' + code.replaceAll('+', '\\+') + '"'));
  }
});

test('camera capture is single-flight and restores the capture control after errors', async () => {
  const scanner = await readFile(new URL('../pdf-scanner.js', import.meta.url), 'utf8');
  assert.match(scanner, /let stream=null,capturing=false/);
  assert.match(scanner, /if\(capturing\)return/);
  assert.match(scanner, /finally\{capturing=false;if\(button\)button\.disabled=!stream;\}/);
  assert.match(scanner, /if\(stream\)stream\.getTracks\(\)\.forEach\(track=>track\.stop\(\)\)/);
});
