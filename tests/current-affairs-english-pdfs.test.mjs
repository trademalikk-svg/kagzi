import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
test('English Current Affairs has its own source and independent PDF outputs',()=>{
 assert.ok(existsSync(new URL('current-affairs/english/source.html',root)));
 const source=read('current-affairs/english/source.html');
 assert.ok(source.includes('<html lang="en">'));
 assert.ok(source.includes('6 November 2026 — Daily Current Affairs'));
 assert.ok(source.includes('Weekly Current Affairs Summary'));
 const generator=read('scripts/build_current_affairs_english_pdfs.py');
 assert.ok(generator.includes('"english" / "day"'));
 assert.ok(generator.includes('"english" / "weekly"'));
 assert.ok(!generator.includes('"day" / "KAGZI-Daily'));
 assert.ok(!generator.includes('"weekly" / "KAGZI-Weekly'));
});
test('English PDFs are linked separately and never merged into Hindi edition',()=>{
 const index=read('current-affairs/english/index.html');
 assert.ok(index.includes('KAGZI-English-Daily-Current-Affairs-2026-11-06.pdf'));
 assert.ok(index.includes('KAGZI-English-Weekly-Current-Affairs-2026-11.pdf'));
 assert.ok(index.includes('not merged with Hindi PDFs'));
 const home=read('current-affairs/index.html');
 assert.ok(home.includes('english/'));
});
test('PDF workflow builds English PDFs from the English-only source',()=>{
 const workflow=read('.github/workflows/current-affairs-pdfs.yml');
 assert.ok(workflow.includes('python scripts/build_current_affairs_english_pdfs.py'));
 assert.ok(workflow.includes('current-affairs/english/**/*.pdf'));
});
