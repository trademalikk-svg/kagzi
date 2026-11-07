import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');

test('legacy protected markers do not block free/public pages',()=>{
 const guard=read('auth-guard.js');
 assert.match(guard,/body\.dataset\.kagziAuthScope!=='membership'/);
 assert.doesNotMatch(guard,/body\.dataset\.kagziProtected/);
});

test('only the private paid library has a page-level membership gate',()=>{
 const library=read('current-affairs/my-library.html');
 assert.match(library,/<body[^>]*data-kagzi-auth-scope="membership"/i);
 const pages=JSON.parse(read('.github/kagzi-html-pages.json'));
 for(const path of pages){
  if(path==='current-affairs/my-library.html')continue;
  const html=read(path);
  assert.doesNotMatch(html,/<body[^>]*data-kagzi-auth-scope="membership"/i,path+' must remain public');
 }
});

test('main header and public CTA do not send visitors to login or signup',()=>{
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
