import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../pdf-native-text-gate.js', import.meta.url), 'utf8');

function loadGate(){
  const window={};
  vm.runInNewContext(source,{window,globalThis:window,module:{exports:{}}});
  return window.KAGZIPdfNativeText;
}

test('native PDF text editing is explicitly disabled until save/reopen evidence is complete',()=>{
  const gate=loadGate();
  const status=gate.status();
  assert.equal(status.available,false);
  assert.equal(status.enabled,false);
  assert.equal(status.engine,'PDFcanvas/PDFium');
  assert.match(status.reason,/save\/reopen regression gate/);
});

test('disabled native text replacement fails closed without invoking an engine',async()=>{
  const gate=loadGate();
  let called=false;
  const engine={replaceText(){called=true;return {bytes:new Uint8Array([1,2,3])};}};
  await assert.rejects(
    gate.replaceText({engine,bytes:new Uint8Array([37,80,68,70]),pageIndex:0,targetText:'old',replacement:'new'}),
    error=>error.code==='KAGZI_NATIVE_TEXT_EDIT_DISABLED'
  );
  assert.equal(called,false,'the unverified engine must never be invoked');
});

test('PDF editor loads the native text gate before the editor controller',async()=>{
  const html=await readFile(new URL('../pdf-editor.html',import.meta.url),'utf8');
  assert.ok(html.indexOf('src="pdf-native-text-gate.js"')>=0);
  assert.ok(html.indexOf('src="pdf-native-text-gate.js"')<html.indexOf('src="pdf-editor.js"'));
});
