import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../pdf-native-text-gate.js', import.meta.url), 'utf8');

function loadGate(itemsByByte, engineOverride) {
  const calls = [];
  const pdfjsLib = {
    getDocument({ data }) {
      const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
      return { promise: Promise.resolve({
        numPages: 1,
        async getPage(pageNumber) {
          assert.equal(pageNumber, 1);
          return { async getTextContent() { return { items: itemsByByte.get(bytes[0]) || [] }; } };
        },
        async destroy() {}
      }) };
    }
  };
  const engine = engineOverride || {
    status() { return { available: true }; },
    async replaceText(args) {
      calls.push(args);
      return Uint8Array.from([2, 37, 80, 68, 70]);
    }
  };
  const window = { KAGZIPdfiumNativeEngine: engine, pdfjsLib };
  vm.runInNewContext(source, { window, globalThis: window, Uint8Array, Array, Error, Promise, Object, String, Number });
  return { gate: window.KAGZIPdfNativeText, calls };
}

test('native edit is enabled only when the PDFium runtime and PDF.js are available', () => {
  const { gate } = loadGate(new Map([[1, [{ str: 'Before' }]]]));
  assert.equal(gate.status().available, true);
  assert.equal(gate.status().enabled, true);
});

test('native edit verifies exact PDF.js text matching and Save/Reopen before returning bytes', async () => {
  const { gate, calls } = loadGate(new Map([
    [1, [{ str: 'Before' }]],
    [2, [{ str: 'After' }]]
  ]));
  const result = await gate.replaceText({
    bytes: Uint8Array.from([1, 37, 80, 68, 70]),
    pageIndex: 0,
    targetText: 'Before',
    replacement: 'After'
  });
  assert.deepEqual(Array.from(result.bytes), [2, 37, 80, 68, 70]);
  assert.deepEqual({ pageIndex: calls[0].pageIndex, targetText: calls[0].targetText, replacement: calls[0].replacement }, {
    pageIndex: 0, targetText: 'Before', replacement: 'After'
  });
  assert.equal(result.verification.savedAndReopened, true);
});

test('native edit fails closed when PDF.js text is partial or duplicated', async () => {
  const { gate, calls } = loadGate(new Map([[1, [{ str: 'Before' }, { str: 'Before' }]]]));
  await assert.rejects(
    gate.replaceText({ bytes: Uint8Array.from([1]), pageIndex: 0, targetText: 'Before', replacement: 'After' }),
    error => error.code === 'KAGZI_NATIVE_TEXT_PDFJS_MATCH_NOT_UNIQUE'
  );
  assert.equal(calls.length, 0);
});

test('native edit rejects output unless reopened PDF contains only the replacement text', async () => {
  const { gate } = loadGate(new Map([
    [1, [{ str: 'Before' }]],
    [2, [{ str: 'Before' }, { str: 'After' }]]
  ]));
  await assert.rejects(
    gate.replaceText({ bytes: Uint8Array.from([1]), pageIndex: 0, targetText: 'Before', replacement: 'After' }),
    error => error.code === 'KAGZI_NATIVE_TEXT_SAVE_REOPEN_FAILED'
  );
});
