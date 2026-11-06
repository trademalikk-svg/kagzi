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
  assert.ok(html.includes('else if(index===2) mPanel.append(makeMarchContent());'));
  assert.ok(html.includes('else if(index===2) yPanel.append(makeMarchContent());'));
  assert.ok(html.includes('function makeMarchContent()'));
  assert.ok(html.includes('else if(index===3) mPanel.append(makeAprilContent());'));
  assert.ok(html.includes('else if(index===3) yPanel.append(makeAprilContent());'));
  assert.ok(html.includes('function makeAprilContent()'));
  assert.ok(html.includes('April 2026'));
  assert.ok(html.includes('CPI मुद्रास्फीति औसतन 3.12%'));
  assert.ok(html.includes('भारत और न्यूजीलैंड ने मुक्त व्यापार समझौते पर हस्ताक्षर किए'));
  assert.ok(html.includes('PRS India — अप्रैल 2026 मासिक नीति समीक्षा'));
  assert.ok(html.includes('March 2026 Monthly Policy Review'));
  assert.ok(html.includes('चालू खाता घाटा GDP का 1.3%'));
  assert.ok(html.includes('Draft Digital Trade Facilitation Bill 2026'));
  assert.ok(html.includes('PRS India — January 2026 Monthly Policy Review'));
  assert.ok(html.includes('PRS India — February 2026 Monthly Policy Review'));
  assert.ok(html.includes('रेपो दर 5.25%'));
  for (const month of ['May','June','July','August','September','October']) {
    assert.ok(html.includes(`function make${month}Content()`), `${month} content function exists`);
  }
  for (const [index, month] of [[4,'May'],[5,'June'],[6,'July'],[7,'August'],[8,'September'],[9,'October']]) {
    assert.ok(html.includes(`else if(index===${index}) mPanel.append(make${month}Content());`));
    assert.ok(html.includes(`else if(index===${index}) yPanel.append(make${month}Content());`));
  }
  assert.ok(html.includes('नवम्बर 2026 का यह संग्रह 6 नवम्बर तक'));
  assert.ok(html.includes('दिसम्बर 2026 अभी भविष्य का महीना है।'));
  assert.ok(html.includes('पूरी, स्रोत-जाँची गई सामग्री अभी इस पुस्तक में नहीं जोड़ी गई'));
});

test('November remains populated and linked to verified daily entries', () => {
  assert.ok(html.includes('else if(index===10) mPanel.append(makeNovemberContent());'));
  assert.ok(html.includes('else if(index===10) yPanel.append(makeNovemberContent());'));
  assert.ok(html.includes('function makeNovemberContent()'));
});
