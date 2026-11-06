import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('PDF Studio hub links to every currently listed PDF workflow', async () => {
  const html = await readFile(new URL('../pdf-studio.html', import.meta.url), 'utf8');
  for (const href of ['pdf-editor.html','pdf-compress.html','jpg-to-pdf.html','image-text-editor.html','pdf-tools.html']) {
    assert.ok(html.includes('href="'+href+'"'), 'missing PDF workflow link: '+href);
  }
  for (const label of ['PDF Edit & Annotate','PDF OCR & Text Scan','Camera PDF Scanner','Merge PDF','Split & Extract Pages','Rotate, Reorder & Organize','Watermark & Page Numbers','Compress PDF','JPG / PNG to PDF']) {
    assert.ok(html.includes(label), 'missing tool category: '+label);
  }
  assert.match(html, /अलग-अलग tools के बीच document अपने-आप share नहीं होता/);
  assert.match(html, /secure redaction नहीं है/);
});

test('PDF tools directory routes its primary call to the unified PDF Studio hub', async () => {
  const html = await readFile(new URL('../pdf-tools.html', import.meta.url), 'utf8');
  assert.match(html, /href="pdf-studio\.html"/);
});
