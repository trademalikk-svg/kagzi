import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('PDF Text tool exports Hindi and other Unicode through a canvas image instead of WinAnsi fonts', async () => {
  const js = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  const textBranch = js.slice(js.indexOf("if(tool==='text'){"), js.indexOf("else if(tool==='highlight')"));
  assert.match(textBranch, /codePointAt\(0\)>255/);
  assert.match(textBranch, /ensureHindiCanvasFont\(\)/);
  assert.match(textBranch, /pdf\.embedPng\(canvas\.toDataURL\('image\/png'\)\)/);
  assert.match(textBranch, /page\.drawImage\(image/);
  assert.match(textBranch, /page\.drawText\(value/);
  assert.match(js, /Intl\.Segmenter\(undefined,\{granularity:'grapheme'\}\)/);
});
