import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../pdf-scanner.js', import.meta.url), 'utf8');

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function loadScanner(getUserMedia) {
  const nodes = new Map();
  const listeners = new Map();
  const makeNode = id => ({
    id, disabled: false, hidden: id === 'cameraPreview', textContent: '', value: '',
    srcObject: null, files: [], classList: { add() {}, remove() {}, toggle() {} },
    addEventListener(name, callback) { listeners.set(id + ':' + name, callback); },
    async play() {}, pause() {}, remove() {}, click() {}
  });
  for (const id of ['openCameraScanner','closeCameraScanner','captureScan','cameraPreview','scanPreviewCanvas','scannerStatus','ocrEditStatus','ocrResults','downloadOcrText','copyOcrText','addOcrTextPage','ocrLanguage','ocrImageInput','scanImageOcr','inspectorText']) nodes.set(id, makeNode(id));
  const document = {
    getElementById: id => nodes.get(id) || null,
    addEventListener(name, callback) { if (name === 'DOMContentLoaded') callback(); }
  };
  const window = { addEventListener() {}, KAGZIPdfOcrRecognize: async () => ({ text: '', confidence: 0, words: [] }) };
  vm.runInNewContext(source, { window, document, navigator: { mediaDevices: { getUserMedia } }, setTimeout, Blob, URL });
  return { nodes, listeners };
}

test('camera startup is single-flight while permission is pending and restores the control afterward', async () => {
  const gate = deferred();
  let requests = 0;
  const mediaStream = { getTracks: () => [{ stop() {} }] };
  const app = loadScanner(() => { requests += 1; return gate.promise; });
  const button = app.nodes.get('openCameraScanner');
  const first = app.listeners.get('openCameraScanner:click')();
  const second = app.listeners.get('openCameraScanner:click')();
  assert.equal(requests, 1, 'a rapid second tap must not create another camera stream');
  assert.equal(button.disabled, true, 'disable Open camera while the permission request is pending');
  gate.resolve(mediaStream);
  await Promise.all([first, second]);
  assert.equal(button.disabled, false, 'allow the user to reopen or restart the camera afterward');
  assert.equal(app.nodes.get('cameraPreview').srcObject, mediaStream);
  assert.match(app.nodes.get('scannerStatus').textContent, /Camera ready/i);
});

test('camera startup lock resets after permission failure so the user can retry', async () => {
  let requests = 0;
  const mediaStream = { getTracks: () => [{ stop() {} }] };
  const app = loadScanner(() => {
    requests += 1;
    return requests === 1 ? Promise.reject(Object.assign(new Error('denied'), { name: 'NotAllowedError' })) : Promise.resolve(mediaStream);
  });
  const button = app.nodes.get('openCameraScanner');
  await app.listeners.get('openCameraScanner:click')();
  assert.equal(button.disabled, false);
  assert.match(app.nodes.get('scannerStatus').textContent, /permission was denied/i);
  await app.listeners.get('openCameraScanner:click')();
  assert.equal(requests, 2);
  assert.equal(app.nodes.get('cameraPreview').srcObject, mediaStream);
  assert.match(app.nodes.get('scannerStatus').textContent, /Camera ready/i);
});
