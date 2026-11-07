import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const publicPages=new Set(['index.html','auth.html','about.html','contact.html','privacy.html','terms.html','content-policy.html','affiliate-disclosure.html']);
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
 assert.ok(pages.length>=120);
 for(const path of pages){
  assert.ok(!publicPages.has(path),path+' must not be in the protected list');
  const html=read(path);
  assert.match(html,/<body\b[^>]*data-kagzi-protected="true"/i,path+' must require login');
  assert.ok(html.includes('/auth-guard.js'),path+' must load shared auth guard');
  assert.ok(html.includes('/config.js'),path+' must load Supabase config');
  assert.ok(html.includes('supabase-js@2'),path+' must load Supabase client');
 }
});
