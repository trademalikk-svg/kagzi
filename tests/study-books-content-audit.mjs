import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const books = ['history-book.html','geography-book.html','up-gk-book.html','economy-book.html','science-book.html','environment-book.html','math-reasoning-book.html','hindi-book.html','mcq-pyq-book.html'];
for (const file of books) {
  const html = readFileSync(new URL('../' + file, import.meta.url), 'utf8');
  test(file + ' has a Hindi book structure, substantive chapter, revision, practice, references and print/mobile support', () => {
    assert.match(html, /<html lang="hi">/);
    assert.match(html, /<title>/);
    assert.match(html, /प्रारंभिक संस्करण/);
    assert.match(html, /विषय-सूची/);
    assert.match(html, /अध्ययन उद्देश्य/);
    assert.match(html, /त्वरित पुनरावृत्ति/);
    assert.match(html, /अभ्यास/);
    assert.match(html, /स्रोत/);
    assert.match(html, /@media\(max-width:620px\)/);
    assert.match(html, /window\.print\(\)/);
    assert.ok((html.match(/<h3>/g) || []).length >= 3);
    assert.ok(html.length > 3500);
  });
}
test('MCQ book clearly distinguishes original practice from official PYQs', () => {
 const html = readFileSync(new URL('../mcq-pyq-book.html', import.meta.url), 'utf8');
 assert.match(html, /मौलिक अभ्यास प्रश्न/);
 assert.match(html, /आधिकारिक PYQ/);
 assert.match(html, /<details>/);
});
