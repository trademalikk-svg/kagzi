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

test('native PDF text editing stays disabled until browser runtime and regression gates pass',()=>{
  const status=loadGate().status();
  assert.equal(status.available,false);
  assert.equal(status.enabled,false);
  assert.equal(status.engine,'KAGZI PDFium WASM');
  assert.match(status.reason,/browser Save\/Reopen regression/);
});

test('disabled native replacement fails closed',async()=>{
  const gate=loadGate();
  await assert.rejects(gate.replaceText({}),error=>error.code==='KAGZI_NATIVE_TEXT_EDIT_DISABLED');
});

test('editor loads the gate before its controller',async()=>{
  const html=await readFile(new URL('../pdf-editor.html',import.meta.url),'utf8');
  const gateAt=html.indexOf('src="pdf-native-text-gate.js"');
  const editorAt=html.indexOf('src="pdf-editor.js"');
  assert.ok(gateAt>=0,'native text gate script must be present');
  assert.ok(editorAt>gateAt,'gate must load before editor controller');
});
