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
