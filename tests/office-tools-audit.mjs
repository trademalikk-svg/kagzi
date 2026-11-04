import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (name) => readFileSync(new URL(name, root), 'utf8');

test('Office Tools workspace exposes all three editors and working export formats', () => {
  const html = read('office.html');
  for (const id of ['wordEditor', 'excelEditor', 'slidesEditor', 'officeAiPrompt', 'officeAiGenerate']) {
    assert.match(html, new RegExp('id="' + id + '"'), id + ' must exist');
  }
  for (const format of ['.docx', '.xlsx', '.pptx']) assert.ok(html.includes(format), format + ' import/export must be discoverable');
  for (const mode of ['Basic', 'Advanced', 'Complete Office Suite']) assert.ok(html.includes(mode), mode + ' mode must be available');
});

test('Office Tools uses local file processing and explicit user-triggered exports', () => {
  const html = read('office.html');
  const js = read('office.js');
  assert.match(html, /Files are processed locally/i);
  assert.match(js, /addEventListener\(['"]click['"]/);
  assert.match(js, /createObjectURL/);
  assert.match(js, /\/api\/assistant/);
  assert.match(js, /mammoth/);
  assert.match(js, /XLSX/);
  assert.match(js, /PptxGenJS/);
});

test('Office Tools catalogue entries route to the dedicated workspace', () => {
  const source = read('modules.js');
  for (const id of [21, 22, 23]) assert.match(source, new RegExp(id + ":'office.html"));
});
