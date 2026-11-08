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
