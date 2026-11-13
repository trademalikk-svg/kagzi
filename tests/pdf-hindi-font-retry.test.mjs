import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

test('Hindi font loading can retry after a temporary network/font failure', async () => {
  const source = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  const start = source.indexOf('let hindiFontPromise=null;');
  const end = source.indexOf('function renderMetrics', start);
  assert.ok(start >= 0 && end > start, 'Hindi font loader should be present');
  const loader = source.slice(start, end) + '\nglobalThis.loadHindiFont = ensureHindiCanvasFont;';
  let attempts = 0;
  class FakeFontFace {
    async load() {
      attempts += 1;
      if (attempts === 1) throw new Error('temporary network error');
      return this;
    }
  }
  const sandbox = {
    window: { FontFace: FakeFontFace },
    FontFace: FakeFontFace,
    document: { fonts: { add() {} } }
  };
  vm.runInNewContext(loader, sandbox);
  assert.equal(await sandbox.loadHindiFont(), false);
  assert.equal(await sandbox.loadHindiFont(), true);
  assert.equal(attempts, 2);
});
