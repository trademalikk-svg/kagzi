import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../pdf-export.js', import.meta.url), 'utf8');

function loadExport(overrides = {}) {
  const calls = { created: [], revoked: [], appended: [], removed: [], timers: [] };
  let anchor;
  class FakeBlob {
    constructor(parts, options) {
      this.parts = parts;
      this.type = options.type;
      this.size = parts.reduce((sum, part) => sum + part.length, 0);
    }
  }
  const window = {
    Blob: FakeBlob,
    URL: {
      createObjectURL(blob) { calls.created.push(blob); return 'blob:test-pdf'; },
      revokeObjectURL(url) { calls.revoked.push(url); }
    },
    document: {
      createElement(tag) {
        assert.equal(tag, 'a');
        anchor = { click() { calls.clicked = true; }, remove() { calls.removed.push(true); } };
        return anchor;
      },
      body: { append(node) { calls.appended.push(node); } }
    },
    setTimeout(callback, delay) { calls.timers.push({ callback, delay }); },
    ...overrides
  };
  vm.runInNewContext(source, { window });
  return { api: window.KAGZIPdfExport, calls, get anchor() { return anchor; } };
}

test('PDF export downloads valid bytes with PDF MIME type and sanitized filename', () => {
  const context = loadExport();
  const { api, calls } = context;
  const result = api.download(new Uint8Array([1, 2, 3]), '../My report?.pdf');
  assert.equal(result.filename, 'My_report_.pdf');
  assert.equal(result.mimeType, 'application/pdf');
  assert.equal(result.size, 3);
  assert.equal(calls.created.length, 1);
  assert.equal(calls.created[0].type, 'application/pdf');
  assert.equal(context.anchor.href, 'blob:test-pdf');
  assert.equal(context.anchor.download, 'My_report_.pdf');
  assert.equal(calls.appended.length, 1);
  assert.equal(calls.clicked, true);
  assert.deepEqual(calls.removed, [true]);
  assert.equal(calls.timers[0].delay, 30000);
  calls.timers[0].callback();
  assert.deepEqual(calls.revoked, ['blob:test-pdf']);
});

test('PDF export rejects empty or invalid bytes without creating a download', () => {
  const { api, calls } = loadExport();
  assert.throws(() => api.download(null, 'document.pdf'), /valid PDF bytes/i);
  assert.throws(() => api.download(new Uint8Array(0), 'document.pdf'), /valid PDF bytes/i);
  assert.equal(calls.created.length, 0);
  assert.equal(calls.clicked, undefined);
});

test('PDF export revokes its temporary URL if the browser download click fails', () => {
  const { api, calls } = loadExport({
    document: {
      createElement() { return { click() { throw new Error('download blocked'); }, remove() {} }; },
      body: { append() {} }
    }
  });
  assert.throws(() => api.download(new Uint8Array([9]), 'document.pdf'), /download blocked/);
  assert.deepEqual(calls.revoked, ['blob:test-pdf']);
});

test('PDF editor loads the export helper before editor code and uses it for edited and split PDFs', async () => {
  const html = await readFile(new URL('../pdf-editor.html', import.meta.url), 'utf8');
  const editor = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  assert.ok(html.indexOf('src="pdf-export.js"') < html.indexOf('src="pdf-editor.js"'));
  assert.match(editor, /KAGZIPdfExport\.download\(finalBytes/);
  assert.match(editor, /KAGZIPdfExport\.download\(bytes/);
});
