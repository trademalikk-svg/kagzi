import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('PDF text replacement preview scales font size with zoom and masks original text', async () => {
  const js = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  const applyHandler = js.slice(js.indexOf('if(el.applyTextEdit)el.applyTextEdit.addEventListener'), js.indexOf('window.KAGZIPdfEditorOpenFile=loadPdf'));
  assert.match(applyHandler, /selectedText\.viewport\.scale/);
  assert.match(applyHandler, /backgroundColor\s*=\s*['\"]#fff['\"]/);
  assert.match(applyHandler, /textAlign\s*=\s*el\.inspectorAlignment\.value/);
});

test('PDF text replacement preview keeps selected text styling consistent with export settings', async () => {
  const js = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  const applyHandler = js.slice(js.indexOf('if(el.applyTextEdit)el.applyTextEdit.addEventListener'), js.indexOf('window.KAGZIPdfEditorOpenFile=loadPdf'));
  for (const setting of ['inspectorFontSize', 'inspectorFontColor', 'inspectorBold', 'inspectorOpacity', 'inspectorAlignment']) {
    assert.ok(applyHandler.includes(setting), `preview should use ${setting}`);
  }
});

test('PDF text selection layer stays above the canvas and receives clicks in select mode', async () => {
  const js = await readFile(new URL('../pdf-editor.js', import.meta.url), 'utf8');
  const css = await readFile(new URL('../pdf-editor.css', import.meta.url), 'utf8');
  assert.match(css, /\.pdf-text-layer\{[^}]*z-index:\s*2/);
  assert.match(css, /\.editor-overlay\{[^}]*z-index:\s*1/);
  assert.match(js, /span\.addEventListener\('click',event=>\{event\.stopPropagation\(\);selectedText=/);
  assert.match(js, /el\.applyTextEdit\.disabled=false/);
});

test('Mobile PDF inspector is positioned before the document canvas instead of below it', async () => {
  const css = await readFile(new URL('../pdf-editor.css', import.meta.url), 'utf8');
  assert.match(css, /@media\(max-width:650px\)\{[^}]*\.pdf-inspector\{grid-row:2/);
  assert.match(css, /\.document-area\{grid-row:3/);
});
