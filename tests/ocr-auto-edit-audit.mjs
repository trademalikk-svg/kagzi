import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../pdf-editor.html', import.meta.url), 'utf8');
const scanner = readFileSync(new URL('../pdf-scanner.js', import.meta.url), 'utf8');

test('OCR result is an editable field with copy and text export actions', () => {
  assert.match(html, /<textarea[^>]+id="ocrResults"/);
  assert.match(html, /id="downloadOcrText"/);
  assert.match(html, /id="copyOcrText"/);
});

test('choosing an image automatically starts local OCR', () => {
  assert.match(scanner, /ocrImageInput[\s\S]*?\?\.addEventListener\('change'/);
  assert.match(scanner, /recognizeSource\(file,'Selected image'\)/);
});

test('capturing a camera scan adds it to the PDF and automatically recognizes text', () => {
  assert.match(scanner, /KAGZIPdfEditorAppendScan\(blob\)/);
  assert.match(scanner, /recognizeSource\(blob,'Scanned page'\)/);
});

test('OCR text can be edited and downloaded without a server request', () => {
  assert.match(scanner, /out\.value=result\.text/);
  assert.match(scanner, /new Blob\(\[text\],\{type:'text\/plain;charset=utf-8'\}\)/);
  assert.doesNotMatch(scanner, /fetch\s*\(/);
});
