import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

test('PDF render metrics preserve CSS page size and increase backing resolution for high-DPI screens', async () => {
  const source = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  const sandbox = { window: {}, document: { addEventListener() {} } };
  vm.runInNewContext(source, sandbox);
  assert.equal(typeof sandbox.window.KAGZIPdfRenderMetrics, 'function',
    'the editor must expose its render-metrics helper for deterministic verification');
  assert.deepEqual(
    JSON.parse(JSON.stringify(sandbox.window.KAGZIPdfRenderMetrics(600, 800, 3))),
    { cssWidth: 600, cssHeight: 800, pixelWidth: 1200, pixelHeight: 1600, outputScale: 2 }
  );
});

test('PDF render metrics never reduce backing resolution below CSS dimensions', async () => {
  const source = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  const sandbox = { window: {}, document: { addEventListener() {} } };
  vm.runInNewContext(source, sandbox);
  assert.deepEqual(
    JSON.parse(JSON.stringify(sandbox.window.KAGZIPdfRenderMetrics(320, 480, 1))),
    { cssWidth: 320, cssHeight: 480, pixelWidth: 320, pixelHeight: 480, outputScale: 1 }
  );
});
