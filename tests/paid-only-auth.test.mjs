import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');

test('Jan Seva and PDF Editor remain public pages',()=>{
 for(const path of ['jan-seva.html','pdf-editor.html']){
  const html=read(path);
  assert.doesNotMatch(html,/<body[^>]*data-kagzi-protected="true"/i);
  assert.match(html,/<script defer src="\/auth-guard\.js"><\/script>/);
 }
});

test('login is requested only for explicitly marked paid items',()=>{
 const guard=read('auth-guard.js');
 assert.match(guard,/target\.closest\('\[data-paid-item\]'\)/);
 assert.doesNotMatch(guard,/\.module-card|data-requires-auth|jan-seva\|pdf-tools/);
 assert.match(guard,/body\.dataset\.kagziAuthScope!=='membership'/);
});
