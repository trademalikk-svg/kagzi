import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const publicPages=new Set(['index.html','modules.html','study-notes.html','auth.html','about.html','paid-library.html','pricing.html','contact.html','privacy.html','terms.html','content-policy.html','affiliate-disclosure.html',
 'current-affairs.html','current-affairs-book.html','current-affairs/archive.html','current-affairs/day/index.html',
 'current-affairs/english/index.html','current-affairs/index.html','current-affairs/monthly/index.html',
 'current-affairs/weekly/index.html','current-affairs/yearly/index.html','split-pdf-pages-guide.html','prepare-documents-for-online-forms-guide.html','photo-tools.html','pdf-tools.html','pdf-compress.html','passport-size-photo-maker.html','mobile-scan-to-pdf-guide.html','jpg-to-pdf.html','gov-documents.html','free-pdf-merge.html','extract-hindi-text-from-image-ocr-guide.html','compress-photo-to-20kb-50kb.html','add-text-notes-to-pdf-guide.html','private-jobs.html','private-jobs-admin.html','economy-book.html','education.html',
 'environment-book.html','geography-book.html','hindi-book.html','history-book.html','math-reasoning-book.html',
 'mcq-pyq-book.html','science-book.html','study-material.html','up-gk-book.html']);
test('shared auth guard fails closed and preserves the requested destination',()=>{
 const guard=read('auth-guard.js');
 assert.ok(guard.includes("body.dataset.kagziProtected!=='true'"));
 assert.ok(guard.includes("if(!await hasSession())location.replace(loginUrl())"));
 assert.ok(guard.includes("const authPath='/auth.html'"));
 assert.ok(guard.includes('auth.getSession()'));
 assert.ok(guard.includes('encodeURIComponent(next)'));
});
test('every non-public HTML route requires a Supabase session',()=>{
 const pages=JSON.parse(read('.github/kagzi-html-pages.json'));
 assert.ok(pages.length>=90);
 for(const path of pages){
  assert.ok(!publicPages.has(path),path+' must not be in the protected list');
  const html=read(path);
  assert.match(html,/<body\b[^>]*data-kagzi-protected="true"/i,path+' must require login');
  assert.ok(html.includes('/auth-guard.js'),path+' must load shared auth guard');
  assert.ok(html.includes('/config.js'),path+' must load Supabase config');
  assert.ok(html.includes('supabase-js@2'),path+' must load Supabase client');
 }
});
