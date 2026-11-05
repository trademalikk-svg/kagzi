import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

test('image editor exposes OCR line normalization and keeps text plus bounding boxes', async () => {
  const source = await readFile(new URL('../image-text-editor.js', import.meta.url), 'utf8');
  const sandbox = { window: {}, document: { addEventListener() {} } };
  vm.runInNewContext(source, sandbox);
  assert.equal(typeof sandbox.window.KAGZIImageEditor.normalizeOcrLines, 'function');
  const result = sandbox.window.KAGZIImageEditor.normalizeOcrLines([
    { text: 'Hello world', bbox: { x0: 10, y0: 20, x1: 110, y1: 45 } },
    { text: '   ', bbox: { x0: 1, y0: 2, x1: 3, y1: 4 } }
  ]);
  assert.equal(result.length, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(result[0])), {
    text: 'Hello world', x: 10, y: 20, width: 100, height: 25
  });
});
