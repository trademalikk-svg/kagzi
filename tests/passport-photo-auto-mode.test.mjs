import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Script } from 'node:vm';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const passportScript = html.match(/<script id="kagzi-photo-standalone-fix">([\s\S]*?)<\/script>/)?.[1] ?? '';

test('passport defaults are automatic and advanced controls start collapsed', () => {
  assert.match(html, /<details class="passport-advanced" id="passportAdvancedSettings">/);
  assert.match(html, /<option value="413x531" selected>India common/);
  assert.match(html, /<option value="#ffffff" selected>White/);
  assert.match(html, /id="passportQuality"[^>]*value="94"/);
  assert.match(html, /id="passportHorizontalPosition"/);
  assert.match(html, /id="passportVerticalPosition"/);
});

test('passport studio navigation link resolves to a real section anchor', () => {
  assert.match(html, /href="#photoPassport"/);
  assert.match(html, /id="photoPassport"/);
});

test('passport processing script parses as JavaScript', () => {
  assert.ok(passportScript.length > 0, 'passport workflow script must exist');
  assert.doesNotThrow(() => new Script(passportScript));
});

test('JPG, PNG and WebP uploads are accepted', () => {
  assert.match(html, /accept="image\/jpeg,image\/png,image\/webp/);
  assert.match(passportScript, /jpe\?g\|png\|webp/);
});

test('advanced settings changes regenerate the passport preview', () => {
  assert.match(passportScript, /renderOutput\(processVersion\)/);
  assert.match(passportScript, /passportQuality/);
  assert.match(passportScript, /passportHorizontalPosition/);
  assert.match(passportScript, /passportVerticalPosition/);
});

test('stale processing results cannot replace the latest selected photo', () => {
  assert.match(passportScript, /processVersion=0/);
  assert.match(passportScript, /if\(token!==processVersion\)return/);
  assert.match(passportScript, /const token=\+\+processVersion/);
});

test('face-detection and background-removal failures are visible and fail closed for download', () => {
  assert.match(passportScript, /Face detection is unavailable/);
  assert.match(passportScript, /No face was detected/);
  assert.match(passportScript, /Photo processing failed:/);
  assert.match(passportScript, /download\.disabled=true/);
});
