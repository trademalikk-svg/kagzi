import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

async function loadOcr(overrides={}){
 const source=await readFile(new URL('../pdf-ocr.js',import.meta.url),'utf8');
 const calls={create:[],parameters:[],render:[]};
 const worker={setParameters:async value=>calls.parameters.push(value),recognize:async()=>({data:{text:'हिंदी पाठ',confidence:91,words:[]}})};
 const sandbox={
  window:{Tesseract:{createWorker:async(...args)=>{calls.create.push(args);return worker;}},...overrides.window},
  document:{createElement:()=>({width:0,height:0,getContext:()=>({})}),getElementById:()=>null,...overrides.document},
  Intl,Uint8Array,Float64Array,Math,Map,Promise
 };
 vm.runInNewContext(source,sandbox);
 return {window:sandbox.window,calls};
}

test('Hindi OCR score uses normalized grapheme-aware CER and WER',async()=>{
 const {window}=await loadOcr();
 const score=window.KAGZIPdfOcrScore;
 const exact=score('कक्षा में विज्ञान।','कक्षा में विज्ञान।');
 assert.equal(exact.characterErrorRate,0);assert.equal(exact.wordErrorRate,0);
 const imperfect=score('कक्षा में विग्यान।','कक्षा में विज्ञान।');
 assert.ok(imperfect.characterErrorRate>0);assert.ok(imperfect.wordErrorRate>0);
 const canonical=score('कि‍ताब','किताब');
 assert.ok(Number.isFinite(canonical.characterErrorRate));
});

test('Hindi OCR worker uses automatic page segmentation and 300 DPI metadata',async()=>{
 const {window,calls}=await loadOcr();
 await window.KAGZIPdfOcrRecognize({},'hin',()=>{});
 assert.deepEqual(calls.create[0].slice(0,2),['hin',1]);
 assert.equal(calls.parameters[0].tessedit_pageseg_mode,'3');
 assert.equal(calls.parameters[0].preserve_interword_spaces,'1');
 assert.equal(calls.parameters[0].user_defined_dpi,'300');
});

test('PDF page OCR renders at high resolution before enhancement',async()=>{
 const {window}=await loadOcr();
 let requestedScale=0;
 const page={getViewport:({scale})=>{requestedScale=scale;return {width:1800,height:2400};},render:()=>({promise:Promise.resolve()})};
 const pdfDoc={getPage:async()=>page};
 await window.KAGZIPdfOcr.detectPageText({pageIndex:0,pdfDoc});
 assert.equal(requestedScale,3);
});
