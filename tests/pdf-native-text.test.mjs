import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

test('native PDF text replacement only targets a complete editable text object',async()=>{
 const source=await readFile(new URL('../pdf-native-text.js',import.meta.url),'utf8');
 const sandbox={window:{}};vm.runInNewContext(source,sandbox);
 const find=sandbox.window.KAGZIPdfNativeText.findExactRun;
 const rect={x:20,y:30,w:100,h:18};
 const run={text:'पुराना पाठ',x:20,y:30,w:100,h:18,editable:true,key:'0:1:20'};
 assert.equal(find([run],'पुराना पाठ',rect),run);
 assert.equal(find([{...run,editable:false}],'पुराना पाठ',rect),null);
 assert.equal(find([{...run,text:'पुराना पाठ और'}],'पुराना पाठ',rect),null);
 assert.equal(find([run],'नया पाठ',rect),null);
});

test('native replacement is wired to PDFium and checks PDF bytes before returning',async()=>{
 const source=await readFile(new URL('../pdf-native-text.js',import.meta.url),'utf8');
 assert.match(source,/pdfcanvas@0\.9\.0/);
 assert.match(source,/@embedpdf\/pdfium@2\.15\.1/);
 assert.match(source,/engine\.applyEdits\(/);
 assert.match(source,/engine\.destroy\(\)/);
 assert.match(source,/PDFium returned an invalid PDF/);
});
