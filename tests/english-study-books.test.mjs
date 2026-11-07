import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');
const data = JSON.parse(read('study-material/english/books.json'));
const expected = [
  'KAGZI-History-English.pdf',
  'KAGZI-Geography-English.pdf',
  'KAGZI-UP-GK-English.pdf',
  'KAGZI-Economy-English.pdf',
  'KAGZI-Science-English.pdf',
  'KAGZI-Environment-English.pdf',
  'KAGZI-Maths-Reasoning-English.pdf',
  'KAGZI-Hindi-English.pdf',
  'KAGZI-MCQ-PYQ-English.pdf'
];

test('English source contains nine distinct subject books and unique PDF names', () => {
  assert.equal(data.books.length, 9);
  assert.deepEqual(data.books.map(book => book.filename).sort(), [...expected].sort());
  assert.equal(new Set(data.books.map(book => book.id)).size, 9);
  for (const book of data.books) {
    assert.ok(book.title && book.subtitle && book.intro, 'missing book metadata: ' + book.id);
    assert.ok(book.chapters.length > 0, 'missing translated chapters: ' + book.id);
    for (const chapter of book.chapters) {
      assert.ok(chapter.title && chapter.objective, 'missing chapter metadata: ' + book.id);
      assert.ok(chapter.sections.length >= 3, 'too few translated sections: ' + book.id);
      assert.ok(chapter.quick.length > 0, 'missing quick revision: ' + book.id);
      assert.ok(chapter.questions.length > 0, 'missing practice questions: ' + book.id);
    }
  }
});

test('English edition is identified as an initial chapter-wise edition, not a complete syllabus', () => {
  assert.match(data.edition, /English Edition/);
  assert.match(data.coverage_note, /does not claim to cover the complete syllabus/i);
  const catalogue = read('study-material/english/index.html');
  assert.match(catalogue, /Nine separate English-medium PDF editions/);
  assert.match(catalogue, /All nine English study books are free/);
});

test('main study catalogue links the separate English library', () => {
  assert.match(read('study-material.html'), /study-material\/english\//);
});

test('English PDF builder validates all nine A4 PDF outputs', () => {
  const script = read('scripts/build_english_study_book_pdfs.py');
  assert.match(script, /Expected 9 English study books/);
  assert.match(script, /format="A4"/);
  assert.match(script, /b"%PDF-"/);
  assert.match(script, /%%EOF/);
});
