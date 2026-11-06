import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const script = readFileSync(new URL('../scripts/build_study_book_pdfs.py', import.meta.url), 'utf8');
const workflow = readFileSync(new URL('../.github/workflows/study-book-pdfs.yml', import.meta.url), 'utf8');
const catalogue = readFileSync(new URL('../study-material.html', import.meta.url), 'utf8');
const files = [
  'KAGZI-History.pdf', 'KAGZI-Geography.pdf', 'KAGZI-UP-GK.pdf',
  'KAGZI-Economy.pdf', 'KAGZI-Science.pdf', 'KAGZI-Environment.pdf',
  'KAGZI-Maths-Reasoning.pdf', 'KAGZI-Hindi.pdf', 'KAGZI-MCQ-PYQ.pdf'
];

test('PDF builder defines all nine separate Hindi study books', () => {
  for (const file of files) assert.ok(script.includes(file), `missing output mapping: ${file}`);
  assert.match(script, /format="A4"/);
  assert.match(script, /Noto Sans Devanagari/);
});

test('PDF builder fails rather than publishing an empty or incomplete book', () => {
  assert.match(script, /raise RuntimeError/);
  assert.match(script, /अध्याय/);
});

test('dedicated workflow builds only study-book PDFs and leaves Current Affairs workflow separate', () => {
  assert.match(workflow, /build_study_book_pdfs\.py/);
  assert.match(workflow, /study-material\.html/);
  assert.doesNotMatch(workflow, /current-affairs\/day|current-affairs\/weekly/);
});

test('study catalogue links generated PDFs', () => {
  for (const file of files) assert.ok(catalogue.includes(file), `catalogue missing PDF link: ${file}`);
});
