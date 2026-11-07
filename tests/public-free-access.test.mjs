import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');

test('shared guard enforces only explicit protected-page markers and explicit paid items',()=>{
 const guard=read('auth-guard.js');
 assert.match(guard,/body\.dataset\.kagziProtected!=='true'/);
 assert.match(guard,/target\.closest\('\[data-paid-item\]'\)/);
 assert.match(guard,/if\(!await hasSession\(\)\)location\.replace\(loginUrl\(\)\)/);
});

test('free tools and public catalogue routes do not carry a page-level login gate',()=>{
 for(const path of ['index.html','pdf-editor.html','photo-tools.html','jan-seva.html','modules.html','paid-library.html','education.html','study-material.html','history-book.html','geography-book.html','up-gk-book.html','economy-book.html','science-book.html','environment-book.html','math-reasoning-book.html','hindi-book.html','mcq-pyq-book.html','current-affairs/index.html','current-affairs/day/index.html','current-affairs/weekly/index.html','current-affairs/monthly/index.html','current-affairs/yearly/index.html','current-affairs/english/index.html','current-affairs/archive.html']){
  assert.doesNotMatch(read(path),/<body\b[^>]*data-kagzi-protected=["']true["']/i,path+' must remain public');
 }
});

test('private paid library, Current Affairs admin and protected workspace routes retain authentication',()=>{
 for(const path of ['current-affairs/my-library.html','current-affairs/admin.html','reader.html','document-studio.html','office.html']){
  assert.match(read(path),/<body\b[^>]*data-kagzi-protected=["']true["']/i,path+' must remain protected');
 }
});

test('homepage directs visitors to the paid catalogue without requiring signup first',()=>{
 const home=read('index.html');
 assert.doesNotMatch(home,/<div class="vip-auth">/);
 assert.doesNotMatch(home,/auth\.html\?mode=(?:login|signup)/i);
 assert.match(home,/paid-library\.html/);
});

test('Supabase auth and paid PDF checkout remain available',()=>{
 const auth=read('auth.js');
 assert.match(auth,/signInWithOAuth/);
 assert.match(auth,/signInWithPassword/);
 assert.match(auth,/signUp/);
 assert.match(auth,/verifyOtp/);
 const config=read('config.js');
 assert.match(config,/SUPABASE_URL/);
 assert.match(config,/SUPABASE_ANON_KEY/);
 const paid=read('paid-library.html');
 assert.match(paid,/if\(!signedInUser\|\|!sessionToken\)/);
 assert.match(paid,/\/api\/payments\/create-order/);
 assert.match(paid,/\/api\/payments\/verify/);
 assert.match(paid,/auth\.html\?mode=login/);
});
