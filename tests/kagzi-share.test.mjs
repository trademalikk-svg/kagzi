import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

test("Share helper includes native share, WhatsApp and KAGZI homepage",async()=>{
 const source=await readFile(new URL("../shared/kagzi-share.js",import.meta.url),"utf8");
 assert.match(source,/navigator\.share/);
 assert.match(source,/https:\/\/wa\.me\//);
 assert.match(source,/https:\/\/kagzi-8cy\.pages\.dev\//);
 assert.match(source,/data-share-page/);
 assert.match(source,/data-whatsapp-page/);
});

test("shared State/UT jobs page exposes KAGZI share controls for all registered regions",async()=>{
 const registry=await readFile(new URL("../government-jobs/assets/regions.js",import.meta.url),"utf8");
 const regions=JSON.parse(registry.match(/window\.KAGZI_REGIONS=(\[[\s\S]*\]);/)[1]);
 assert.equal(regions.length,36);
 const html=await readFile(new URL("../government-jobs/states/index.html",import.meta.url),"utf8");
 assert.match(html,/kagzi-share\.js/);
 assert.match(html,/data-share-page/);
 assert.match(html,/data-whatsapp-page/);
});
