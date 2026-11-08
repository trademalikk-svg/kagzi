import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../pdfium-native-text-engine.js',import.meta.url),'utf8');
function sandbox(factory){
  const window={KagziPdfiumModule:factory};
  vm.runInNewContext(source,{window,globalThis:window,Uint8Array,Array,Error,Promise,Object,String,Number});
  return window.KAGZIPdfiumNativeEngine;
}

test('native adapter reports unavailable when browser WASM factory is absent',async()=>{
  const api=sandbox(undefined);
  assert.equal(api.status().available,false);
  await assert.rejects(api.replaceText({bytes:new Uint8Array([1]),pageIndex:0,targetText:'A',replacement:'B'}),e=>e.code==='KAGZI_PDFIUM_RUNTIME_UNAVAILABLE');
});

test('native adapter marshals UTF-32 text and returns a copied PDF result',async()=>{
  const memory=new ArrayBuffer(1024);
  const module={
    HEAPU8:new Uint8Array(memory),
    HEAPU32:new Uint32Array(memory),
    _malloc:(()=>{let next=16;return n=>{const p=next;next+=n+8;return p;};})(),
    _free(){},
    _kagzi_pdf_free(){},
    ccall(name,returnType,argTypes,args){
      assert.equal(name,'kagzi_pdf_replace_text');
      const [pdfPtr,pdfSize,page,targetPtr,targetLength,replacementPtr,replacementLength,outPtrPtr,outSizePtr]=args;
      assert.equal(page,2);
      assert.deepEqual(Array.from(this.HEAPU8.slice(pdfPtr,pdfPtr+pdfSize)),[37,80,68,70]);
      assert.deepEqual(Array.from(this.HEAPU32.slice(targetPtr>>>2,(targetPtr>>>2)+targetLength)),[0x1F600]);
      assert.deepEqual(Array.from(this.HEAPU32.slice(replacementPtr>>>2,(replacementPtr>>>2)+replacementLength)),[0x41,0x4E2D]);
      const output=Uint8Array.from([37,80,68,70,45,49]);
      const outputPtr=600;
      this.HEAPU8.set(output,outputPtr);
      this.HEAPU32[outPtrPtr>>>2]=outputPtr;
      this.HEAPU32[outSizePtr>>>2]=output.length;
      return 0;
    }
  };
  const api=sandbox(()=>Promise.resolve(module));
  const result=await api.replaceText({bytes:Uint8Array.from([37,80,68,70]),pageIndex:2,targetText:'😀',replacement:'A中'});
  assert.deepEqual(Array.from(result),[37,80,68,70,45,49]);
  assert.notEqual(result.buffer,memory);
});

test('native adapter rejects non-success PDFium result without returning output',async()=>{
  const module={HEAPU8:new Uint8Array(512),HEAPU32:new Uint32Array(128),_malloc:(()=>{let p=8;return n=>{const q=p;p+=n+4;return q;};})(),_free(){},_kagzi_pdf_free(){},ccall(){return -5;}};
  const api=sandbox(()=>Promise.resolve(module));
  await assert.rejects(api.replaceText({bytes:Uint8Array.from([1]),pageIndex:0,targetText:'same',replacement:'new'}),e=>e.code==='KAGZI_PDFIUM_REPLACEMENT_FAILED'&&/ambiguous/.test(e.message));
});
