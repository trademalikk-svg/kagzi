import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../current-affairs-book.html', import.meta.url), 'utf8');

test('monthly current affairs are generated from complete daily news entries by subject', () => {
  assert.match(html, /FULL MONTHLY COMPILATION/);
  assert.match(html, /monthlySubjects/);
  assert.match(html, /subjectFor\(article\)/);
  assert.match(html, /article\.cloneNode\(true\)/);
  assert.match(html, /माह अभी जारी है/);
});

test('annual current affairs contains a January-to-December month archive', () => {
  assert.match(html, /const months = \['जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितम्बर','अक्टूबर','नवम्बर','दिसम्बर'\]/);
  assert.match(html, /year-2026-/);
  assert.match(html, /नवम्बर का प्रारंभिक भाग/);
  assert.match(html, /पूर्ण, स्रोत-जाँची गई सामग्री अभी/);
});

test('monthly and annual archives retain original source links and do not invent missing-month data', () => {
  assert.match(html, /PIB —/);
  assert.match(html, /अपुष्ट घटना नहीं जोड़ी गई है/);
  assert.match(html, /कोई तथ्य या आँकड़ा नहीं गढ़ा गया है/);
});
