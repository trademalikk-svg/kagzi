import test from 'node:test';
import assert from 'node:assert/strict';
import { books, filterBooks, isPublishable } from '../education-data.mjs';

test('published catalogue contains only rights-cleared books with a source', () => {
  assert.ok(books.length > 0, 'catalogue should contain curated books');
  for (const book of books) {
    assert.ok(isPublishable(book), `book "${book.title}" must have verified rights and a source`);
  }
});

test('language filter returns only the requested edition language', () => {
  const hindi = filterBooks(books, { language: 'hi' });
  assert.ok(hindi.length > 0);
  assert.ok(hindi.every(book => book.language === 'hi'));
});

test('search matches title, author, subject and description case-insensitively', () => {
  const results = filterBooks(books, { query: 'history' });
  assert.ok(results.length > 0);
  assert.ok(results.every(book => /history/i.test([book.title, book.author, book.subject, book.description].join(' '))));
});

test('combined language and category filters narrow results together', () => {
  const results = filterBooks(books, { language: 'en', category: 'literature' });
  assert.ok(results.length > 0);
  assert.ok(results.every(book => book.language === 'en' && book.category === 'literature'));
});

test('catalogue entries do not depend on external reading URLs', () => {
  for (const book of books) {
    assert.equal('sourceUrl' in book, false);
    assert.ok(book.contentPath === null || (book.contentPath.startsWith('/library/books/') && book.contentPath.endsWith('.pdf')));
  }
});

test('unknown language and unmatched query return no results', () => {
  assert.deepEqual(filterBooks(books, { language: 'xx' }), []);
  assert.deepEqual(filterBooks(books, { query: 'no-such-book-phrase' }), []);
});
