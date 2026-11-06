import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../current-affairs-book.html', import.meta.url), 'utf8');

test('monthly archive exposes all twelve selectable months', () => {
  assert.ok(html.includes('मासिक करंट अफेयर्स — 2026'));
  assert.ok(html.includes("monthButtons('monthly',10)"));
  assert.ok(html.includes('function showMonthly(index)'));
  assert.ok(html.includes("mNav.addEventListener('click'"));
  assert.ok(html.includes("'जनवरी','फरवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितम्बर','अक्टूबर','नवम्बर','दिसम्बर'"));
});

test('yearly archive exposes all twelve selectable months', () => {
  assert.ok(html.includes('वार्षिक करंट अफेयर्स — 2026'));
  assert.ok(html.includes("monthButtons('yearly',10)"));
  assert.ok(html.includes('function showYearly(index)'));
  assert.ok(html.includes("yNav.addEventListener('click'"));
});

test('January and February contain sourced content in monthly and yearly archives', () => {
  assert.ok(html.includes("if(index===0) mPanel.append(makeJanuaryContent());"));
  assert.ok(html.includes("else if(index===1) mPanel.append(makeFebruaryContent());"));
  assert.ok(html.includes("if(index===0) yPanel.append(makeJanuaryContent());"));
  assert.ok(html.includes("else if(index===1) yPanel.append(makeFebruaryContent());"));
  assert.ok(html.includes('function makeJanuaryContent()'));
  assert.ok(html.includes('function makeFebruaryContent()'));
  assert.ok(html.includes('PRS India — January 2026 Monthly Policy Review'));
  assert.ok(html.includes('PRS India — February 2026 Monthly Policy Review'));
  assert.ok(html.includes('रेपो दर 5.25%'));
  assert.ok(html.includes('पूरी, स्रोत-जाँची गई सामग्री अभी इस पुस्तक में नहीं जोड़ी गई'));
});

test('November remains populated and linked to verified daily entries', () => {
  assert.ok(html.includes('else if(index===10) mPanel.append(makeNovemberContent());'));
  assert.ok(html.includes('else if(index===10) yPanel.append(makeNovemberContent());'));
  assert.ok(html.includes('function makeNovemberContent()'));
});
