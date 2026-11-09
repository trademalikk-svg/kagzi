import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

test('Hindi OCR score uses normalized grapheme-aware CER and WER',async()=>{
 const source=await readFile(new URL('../pdf-ocr.js',import.meta.url),'utf8');
 const sandbox={window:{Tesseract:{createWorker:async()=>({})}},document:{},Intl};
 vm.runInNewContext(source,sandbox);
 const score=sandbox.window.KAGZIPdfOcrScore;
 const exact=score('कक्षा में विज्ञान।','कक्षा में विज्ञान।');
 assert.equal(exact.characterErrorRate,0);assert.equal(exact.wordErrorRate,0);
 const imperfect=score('कक्षा में विग्यान।','कक्षा में विज्ञान।');
 assert.ok(imperfect.characterErrorRate>0);assert.ok(imperfect.wordErrorRate>0);
 const canonical=score('कि‍ताब','किताब');
 assert.ok(Number.isFinite(canonical.characterErrorRate));
});
