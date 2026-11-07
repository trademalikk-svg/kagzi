import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
test('English Current Affairs generates one independent PDF for each date plus weekly',()=>{
 assert.ok(existsSync(new URL('current-affairs/english/source.html',root)));
 const source=read('current-affairs/english/source.html');
 assert.ok(source.includes('<html lang="en">'));
 for (const day of ['06','05','04']) assert.ok(source.includes('id="daily-'+Number(day)+'-nov"'));
 assert.ok(source.includes('Weekly Current Affairs Summary'));
 const generator=read('scripts/build_current_affairs_english_pdfs.py');
 for (const day of ['06','05','04']) assert.ok(generator.includes('KAGZI-English-Daily-Current-Affairs-2026-11-'+day+'.pdf'));
 assert.ok(generator.includes('KAGZI-English-Weekly-Current-Affairs-2026-11.pdf'));
 assert.ok(generator.includes('page.locator(selector).evaluate'));
 assert.ok(generator.includes('page.locator("#weekly")'));
 assert.ok(generator.includes('section[id^="daily-"]'), 'English weekly PDF collects dated daily sections');
 assert.ok(generator.includes('article.news'), 'English weekly PDF includes full daily news articles');
 assert.ok(generator.includes('weekly-daily-roundup'), 'English weekly PDF adds a dated news digest');
 assert.ok(generator.includes('#daily-6-nov .quiz'), 'English weekly PDF extracts daily MCQs');
 assert.ok(generator.includes('weekly_mcq'), 'English weekly PDF adds the MCQ section to weekly output');
 assert.ok(!generator.includes('current-affairs" / "day"'));
});
test('English index links each date separately and keeps Hindi separate',()=>{
 const index=read('current-affairs/english/index.html');
 for (const day of ['06','05','04']) assert.ok(index.includes('KAGZI-English-Daily-Current-Affairs-2026-11-'+day+'.pdf'));
 assert.ok(index.includes('KAGZI-English-Weekly-Current-Affairs-2026-11.pdf'));
 assert.ok(index.includes('never merged with Hindi PDFs'));
 const home=read('current-affairs/index.html');
 assert.ok(home.includes('english/'));
});
test('PDF workflow builds English PDFs from English-only source',()=>{
 const workflow=read('.github/workflows/current-affairs-pdfs.yml');
 assert.ok(workflow.includes('python scripts/build_current_affairs_english_pdfs.py'));
 assert.ok(workflow.includes('current-affairs/english/**/*.pdf'));
});
