import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = path => readFileSync(new URL(path, root), "utf8");

test("Learning Hub links to the Board Updates directory",()=>{
 const education=read("education.html");
 assert.match(education,/href="board-updates\//);
});

test("Board Updates directory exposes exactly UP Board and CBSE",()=>{
 const html=read("board-updates/index.html");
 const links=[...html.matchAll(/href="(up-board|cbse)\//g)].map(match=>match[1]);
 assert.deepEqual([...new Set(links)].sort(),["cbse","up-board"]);
 assert.doesNotMatch(html,/ICSE|NIOS|Bihar Board|MP Board/);
});

test("UP Board and CBSE each have a dedicated entry page",()=>{
 assert.ok(existsSync(new URL("board-updates/up-board/index.html",root)));
 assert.ok(existsSync(new URL("board-updates/cbse/index.html",root)));
});

test("UP Board and CBSE pages expose all six notice categories and share controls",()=>{
 for(const board of ["up-board","cbse"]){
  const html=read("board-updates/"+board+"/index.html");
  for(const category of ["result","date-sheet","admit-card","practical","compartment","notice"]) assert.match(html,new RegExp('data-category="'+category+'"'));
  assert.match(html,/data-share-page/);
  assert.match(html,/data-whatsapp-page/);
  assert.match(html,/board-updates\.js/);
 }
});

test("board notice data contains only allowed categories and official board URLs",()=>{
 for(const board of ["up-board","cbse"]){
  const data=JSON.parse(read("board-updates/data/"+board+".json"));
  assert.ok(Array.isArray(data.items));
  for(const item of data.items){
   assert.equal(item.board,board);
   assert.ok(["result","date-sheet","admit-card","practical","compartment","notice"].includes(item.category));
   assert.match(item.officialUrl,/^https:\/\//);
   assert.ok(item.publishedAt);
   assert.ok(item.lastCheckedAt);
  }
 }
});

test("shared board renderer preserves archives and provides notice sharing",()=>{
 const js=read("board-updates/assets/board-updates.js");
 assert.match(js,/publishedAt/);
 assert.match(js,/lastCheckedAt/);
 assert.match(js,/navigator\.share/);
 assert.match(js,/wa\.me/);
 assert.match(js,/clipboard\.writeText/);
 assert.match(js,/createElement/);
});
