import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const htmlPages=()=>execFileSync('git',['ls-files','*.html'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);

test('legacy protected markers do not block free/public pages',()=>{
 const guard=read('auth-guard.js');
 assert.match(guard,/body\.dataset\.kagziAuthScope!=='membership'/);
 assert.doesNotMatch(guard,/body\.dataset\.kagziProtected/);
});

test('only the private paid library has a page-level membership gate',()=>{
 const pages=htmlPages();
 assert.ok(pages.length>=100);
 for(const path of pages){
  const html=read(path);
  if(path==='current-affairs/my-library.html'){
   assert.match(html,/<body[^>]*data-kagzi-auth-scope="membership"/i);
  }else{
   assert.doesNotMatch(html,/<body[^>]*data-kagzi-auth-scope="membership"/i,path+' must remain public');
  }
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
