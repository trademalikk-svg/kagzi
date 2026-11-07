import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');

test('shared auth guard limits page redirects to the paid membership scope',()=>{
 const guard=read('auth-guard.js');
 assert.match(guard,/body\.dataset\.kagziAuthScope!=='membership'/);
 assert.doesNotMatch(guard,/body\.dataset\.kagziProtected/);
 assert.match(guard,/if\(!await hasSession\(\)\)location\.replace\(loginUrl\(\)\)/);
 assert.match(guard,/const authPath='\/auth\.html'/);
 assert.match(guard,/auth\.getSession\(\)/);
 assert.match(guard,/encodeURIComponent\(next\)/);
});

test('all audited free routes are public; only My Paid Library has a page gate',()=>{
 const pages=JSON.parse(read('.github/kagzi-html-pages.json'));
 assert.ok(pages.length>=100);
 for(const path of pages){
  const html=read(path);
  assert.ok(html.includes('/auth-guard.js'),path+' must keep the shared guard available');
  if(path==='current-affairs/my-library.html'){
   assert.match(html,/<body[^>]*data-kagzi-auth-scope="membership"/i);
  }else{
   assert.doesNotMatch(html,/<body[^>]*data-kagzi-auth-scope="membership"/i,path+' must remain public');
  }
 }
});
