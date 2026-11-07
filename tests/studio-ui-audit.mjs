import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = readFileSync(new URL('../script.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../style.css', import.meta.url), 'utf8');

test('studio document IDs are unique', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepEqual([...new Set(duplicates)], []);
});

test('Photo Studio exposes the approved feature groups', () => {
  for (const id of ['photoStudio','photoResize','photoPassport','photoCrop','photoBackground','photoCompress','photoInput','passportPreset','photoCropX','photoRotate','removePhotoBackground','applyPhotoBackground','compressPhotoBtn','photoPreview']) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  for (const feature of ['removeBackground','buildPhotoBlob','downloadPhotoBlob','photoTargetKB']) assert.ok(script.includes(feature), feature);
});

test('PDF Studio exposes grouped tools and local preview', () => {
  for (const id of ['pdfWorkbench','pdfMerge','pdfSplit','pdfCompress','pdfPageManager','pdfConvert','pdfTextEditor','pdfPreview','pdfPreviewInput','pdfPreviewCanvas','pdfPreviewStatus']) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  assert.match(script, /pdfjsLib\.getDocument/);
});

test('shared studio layout has mobile responsive rules', () => {
  assert.match(css, /\.studio-layout/);
  assert.match(css, /@media\(max-width:850px\)/);
  assert.match(css, /@media\(max-width:520px\)/);
});

test('Advanced Photo Editor exposes live adjustments and text overlay', () => {
  for (const id of ['photoAdjust','photoBrightness','photoContrast','photoSaturation','photoGrayscale','photoBlur','photoText','photoTextSize','photoTextColor','photoTextFont','photoTextX','photoTextY','photoTextPreview']) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  for (const feature of ['photoFilterCss','updatePhotoPreviewEffects','ctx.filter=photoFilterCss()','overlayText.split']) assert.ok(script.includes(feature), feature);
  assert.match(html, /<b>PDF &amp; Photo Editor<\/b>/);
});
