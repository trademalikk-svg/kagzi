import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../study-material.html', import.meta.url), 'utf8');
const paths = ['history-book.html','geography-book.html','up-gk-book.html','economy-book.html','science-book.html','environment-book.html','math-reasoning-book.html','hindi-book.html','mcq-pyq-book.html'];
test('catalogue links all nine standalone subject books', () => { for (const path of paths) assert.match(html, new RegExp('href="' + path.replaceAll('.', '\\.') + '"')); });
test('catalogue retains Current Affairs and Polity resources', () => { assert.match(html, /current-affairs-book\.html/); assert.match(html, /competitive-polity-complete\.html/); });
test('catalogue has mobile responsive layout and honest coverage status', () => { assert.match(html, /@media\(max-width:650px\)/); assert.match(html, /प्रारंभिक संस्करण/); assert.match(html, /पूर्ण पाठ्यक्रम नहीं बताया गया/); });
