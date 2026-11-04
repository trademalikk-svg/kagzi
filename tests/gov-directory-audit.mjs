import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html=readFileSync(new URL('../gov-documents.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../gov-documents.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../gov-documents.css',import.meta.url),'utf8');
test('government directory page has search and filters',()=>{for(const id of ['search','category','region','cards','count'])assert.match(html,new RegExp('id="'+id+'"'));});
test('government catalogue contains at least 100 named entries and official portal links',()=>{assert.ok((js.match(/^\["/gm)||[]).length>=100);for(const host of ['services.india.gov.in','digilocker.gov.in','web.umang.gov.in','edistrict.up.gov.in','parivahan.gov.in'])assert.ok(js.includes(host));});
test('directory renders safely using textContent and responsive CSS',()=>{assert.match(js,/textContent/);assert.match(css,/@media\(max-width:540px\)/);assert.doesNotMatch(js,/innerHTML\s*=/);});
