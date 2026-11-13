import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const fontPath=new URL('../assets/fonts/NotoSansDevanagari-Regular.ttf',import.meta.url);
test('PDF editor ships and uses its local Devanagari font',()=>{
 const font=readFileSync(fontPath);assert.ok(font.length>20000,'font asset should be a complete TTF');assert.equal(font.subarray(0,4).toString('ascii'),'\u0000\u0001\u0000\u0000','font must have a TrueType sfnt header');
 const css=readFileSync(new URL('../pdf-editor.css',import.meta.url),'utf8');assert.match(css,/font-family:"KAGZI Noto Sans Devanagari";src:url\("\/assets\/fonts\/NotoSansDevanagari-Regular\.ttf"\)/);
 const html=readFileSync(new URL('../pdf-editor.html',import.meta.url),'utf8');assert.match(html,/rel="preload" href="\/assets\/fonts\/NotoSansDevanagari-Regular\.ttf"/);
 const js=readFileSync(new URL('../pdf-editor.js',import.meta.url),'utf8');assert.match(js,/url\(\/assets\/fonts\/NotoSansDevanagari-Regular\.ttf\)/);assert.doesNotMatch(js,/raw\.githubusercontent\.com\/notofonts\/noto-fonts/);
});
