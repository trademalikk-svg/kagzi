import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

async function loadTextStreamTools() {
  const source = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  const sandbox = { window: {}, document: { addEventListener() {} } };
  vm.runInNewContext(source, sandbox);
  return sandbox.window.KAGZIPdfTextStream;
}

test('removes a complete plain-text token from a PDF content stream without changing operators', async () => {
  const tools = await loadTextStreamTools();
  assert.equal(
    tools.blankTextInStream('BT (Invoice) Tj ET', 'Invoice'),
    'BT () Tj ET'
  );
});

test('removes a complete hex-encoded single-byte text token', async () => {
  const tools = await loadTextStreamTools();
  assert.equal(
    tools.blankTextInStream('BT <48656C6C6F> Tj ET', 'Hello'),
    'BT <> Tj ET'
  );
});

test('does not blank a token when the requested text is only part of that token', async () => {
  const tools = await loadTextStreamTools();
  assert.equal(
    tools.blankTextInStream('BT (Invoice Number) Tj ET', 'Invoice'),
    null
  );
});

test('ignores PDF comments and safely decodes escaped literal characters', async () => {
  const tools = await loadTextStreamTools();
  assert.equal(
    tools.blankTextInStream('% (Invoice) Tj\nBT (A\\040B) Tj ET', 'A B'),
    '% (Invoice) Tj\nBT () Tj ET'
  );
});

test('removes a complete token inside a TJ text array', async () => {
  const tools = await loadTextStreamTools();
  assert.equal(
    tools.blankTextInStream('BT [(A) -20 (B)] TJ ET', 'A'),
    'BT [() -20 (B)] TJ ET'
  );
});

test('does not treat marked-content metadata strings as visible text operands', async () => {
  const tools = await loadTextStreamTools();
  assert.equal(
    tools.blankTextInStream('/Span << /ActualText (Invoice) >> BDC EMC', 'Invoice'),
    null
  );
});
