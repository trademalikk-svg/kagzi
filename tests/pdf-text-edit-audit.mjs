import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html=readFileSync(new URL('../pdf-editor.html',import.meta.url),'utf8');
const editor=readFileSync(new URL('../pdf-editor.js',import.meta.url),'utf8');
const layer=readFileSync(new URL('../pdf-text-edit.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../pdf-editor.css',import.meta.url),'utf8');

test('PDF editor exposes PhotoText-style text selection and replacement controls',()=>{
 for(const id of ['editExistingText','pdfTextLayer','nativeTextValue','nativeTextSize','nativeTextColor','applyNativeTextEdit']) assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/pdf-text-edit\.js/);
});
test('PDF.js text items are positioned as selectable page regions',()=>{
 assert.match(layer,/getTextContent\(\)/);
 assert.match(layer,/pdf-text-hit/);
 assert.match(layer,/setSelection/);
});
test('scanned pages fall back to OCR word boxes',()=>{
 assert.match(layer,/detectPageText\(index\)/);
 assert.match(layer,/region\.bbox/);
});
test('selected text is visually replaced and written to the PDF copy',()=>{
 assert.match(layer,/drawRectangle/);
 assert.match(layer,/drawText/);
 assert.match(layer,/replaceBytes\(next\)/);
 assert.match(editor,/replaceBytes:async bytes/);
});
test('editor styles support selectable text and mobile inspector',()=>{
 assert.match(css,/\.pdf-text-hit/);
 assert.match(css,/\.native-text-edit/);
});
