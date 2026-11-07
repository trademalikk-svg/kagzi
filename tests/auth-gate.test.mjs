import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');

test('shared auth guard limits page redirects to the paid membership scope',()=>{
 const guard=read('auth-guard.js');
 assert.ok(guard.includes("body.dataset.kagziAuthScope!=='membership'"));
 assert.ok(!guard.includes('body.dataset.kagziProtected'));
 assert.ok(guard.includes("if(!await hasSession())location.replace(loginUrl())"));
 assert.ok(guard.includes("const authPath='/auth.html'"));
 assert.ok(guard.includes('auth.getSession()'));
 assert.ok(guard.includes('encodeURIComponent(next)'));
});

test('every tracked HTML page is public except the private paid library',()=>{
 const pages=execFileSync('git',['ls-files','*.html'],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
 assert.ok(pages.length>=100);
 for(const path of pages){
  const html=read(path);
  if(path==='current-affairs/my-library.html'){
   assert.match(html,/<body[^>]*data-kagzi-auth-scope="membership"/i,path+' must remain gated');
  }else{
   assert.doesNotMatch(html,/<body[^>]*data-kagzi-auth-scope="membership"/i,path+' must remain public');
  }
 }
});
