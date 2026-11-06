import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../current-affairs-book.html', import.meta.url), 'utf8');

test('monthly archive exposes all twelve selectable months', () => {
  assert.match(html, /मासिक करंट अफेयर्स — 2026/);
  assert.match(html, /const mNav=monthButtons\('monthly',10\)/);
  assert.match(html, /function showMonthly\(index\)/);
  assert.match(html, /mNav\.addEventListener\('click'/);
  assert.match(html, /जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितम्बर','अक्टूबर','नवम्बर','दिसम्बर/);
});

test('yearly archive exposes all twelve selectable months', () => {
  assert.match(html, /वार्षिक करंट अफेयर्स — 2026/);
  assert.match(html, /const yNav=monthButtons\('yearly',10\)/);
  assert.match(html, /function showYearly\(index\)/);
  assert.match(html, /yNav\.addEventListener\('click'/);
});

test('January and November show sourced content while other months remain clearly marked pending', () => {
  assert.match(html, /id='monthlyMonthPanel'/);
  assert.match(html, /id='yearlyMonthPanel'/);
  assert.match(html, /if\(index===0\) mPanel\.append\(makeJanuaryContent\(\)\)/);\n  assert.match(html, /else if\(index===10\) mPanel\.append\(makeNovemberContent\(\)\)/);\n  assert.match(html, /function makeJanuaryContent\(\)/);
  assert.match(html, /if\(index===0\) yPanel\.append\(makeJanuaryContent\(\)\)/);\n  assert.match(html, /else if\(index===10\) yPanel\.append\(makeNovemberContent\(\)\)/);\n  assert.match(html, /PRS India — January 2026 Monthly Policy Review/);
  assert.match(html, /पूरी, स्रोत-जाँची गई सामग्री अभी इस पुस्तक में नहीं जोड़ी गई/);
});
