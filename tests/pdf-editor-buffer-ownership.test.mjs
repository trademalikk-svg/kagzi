import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../pdf-editor.js',import.meta.url),'utf8');

test('PDF.js receives a separate buffer so the editable working copy is not detached',()=>{
 assert.match(source,/const bytes=new Uint8Array\(await file\.arrayBuffer\(\)\);const renderBytes=bytes\.slice\(\);const task=pdfjsLib\.getDocument\(\{data:renderBytes\}\)/);
 assert.match(source,/originalFile=file;workingBytes=bytes;pdfDoc=doc/);
 assert.doesNotMatch(source,/pdfjsLib\.getDocument\(\{data:bytes\}\)/);
});
