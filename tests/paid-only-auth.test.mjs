import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');

test('homepage and Jan Seva remain public while education and editor pages load the auth guard',()=>{
 for(const path of ['index.html','jan-seva.html']){
  const html=read(path);
  assert.doesNotMatch(html,/<body[^>]*data-kagzi-protected="true"/i);
 }
 for(const path of ['education.html','pdf-editor.html','image-text-editor.html','document-studio.html']){
  const html=read(path);
  assert.match(html,/<script defer src="\/auth-guard\.js"><\/script>/);
 }
});

test('auth guard gates education and editing routes but keeps unrelated pages public',()=>{
 const guard=read('auth-guard.js');
 assert.match(guard,/protectedExact=new Set/);
 assert.match(guard,/path\.startsWith\('\/current-affairs\/'\)/);
 assert.match(guard,/path\.startsWith\('\/study-material\/'\)/);
 assert.match(guard,/target\.closest\('\[data-paid-item\]'\)/);
 assert.match(guard,/if\(document\.body\.dataset\.kagziProtected!=='true'&&!isProtectedPath\(\)\)return/);
 assert.doesNotMatch(guard,/jan-seva\.html|\/jan-seva\|\/pdf-tools/);
});
