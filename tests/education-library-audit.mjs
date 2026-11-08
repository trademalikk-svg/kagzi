import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { books, filterBooks, isPublishable } from '../education-data.mjs';

const fixtures = [
  {id:'hi1',title:'इतिहास की पुस्तक',author:'लेखक',language:'hi',category:'exam',subject:'इतिहास',description:'अध्ययन सामग्री',sourceName:'KAGZI Library',contentPath:'books/abc-123.pdf',rightsStatus:'permission-granted'},
  {id:'en1',title:'History Basics',author:'Writer',language:'en',category:'literature',subject:'World history',description:'A learning book',sourceName:'KAGZI Library',contentPath:'books/def-456.pdf',rightsStatus:'licensed'}
];

test('catalogue is loaded from KAGZI database rather than hard-coded external listings', () => {
  assert.deepEqual(books, []);
  assert.match(awaitlessRead('education.html'), /from\('kagzi_library_files'\)/);
});

function awaitlessRead(path) {
  return requireReadFile(path);
}
function requireReadFile(path) {
  return readFileSync(new URL('../' + path, import.meta.url), 'utf8');
}
import { readFileSync } from 'node:fs';

test('only entries with a valid internal PDF path and rights declaration are publishable', () => {
  assert.ok(fixtures.every(isPublishable));
  assert.equal(isPublishable({...fixtures[0],contentPath:'https://outside.example/book.pdf'}), false);
  assert.equal(isPublishable({...fixtures[0],rightsStatus:'unknown'}), false);
});

test('language filter returns only the requested edition language', () => {
  const hindi = filterBooks(fixtures, { language: 'hi' });
  assert.equal(hindi.length, 1);
  assert.ok(hindi.every(book => book.language === 'hi'));
});

test('search matches title, author, subject and description case-insensitively', () => {
  const results = filterBooks(fixtures, { query: 'history' });
  assert.equal(results.length, 1);
  assert.match(results[0].title, /History/);
});

test('combined language and category filters narrow results together', () => {
  const results = filterBooks(fixtures, { language: 'en', category: 'literature' });
  assert.equal(results.length, 1);
  assert.equal(results[0].id, 'en1');
});

test('unknown language and unmatched query return no results', () => {
  assert.deepEqual(filterBooks(fixtures, { language: 'xx' }), []);
  assert.deepEqual(filterBooks(fixtures, { query: 'no-such-book-phrase' }), []);
});


test('empty library and empty filter results show distinct, accessible Hindi guidance', async () => {
  const page = await readFile(new URL('../education.html', import.meta.url), 'utf8');
  assert.match(page, /id="emptyState" role="status" aria-live="polite"/);
  assert.match(page, /books\.length\s*\?/);
  assert.match(page, /आपकी खोज या चुने गए filters से कोई eBook नहीं मिली/);
  assert.match(page, /कोई स्वीकृत eBook प्रकाशित नहीं है/);
  assert.match(page, /emptyState\.style\.display = 'block'/);
});
