import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const allIndia = await readFile(new URL("../government-schemes/index.html", import.meta.url), "utf8");
const up = await readFile(new URL("../government-schemes/uttar-pradesh/index.html", import.meta.url), "utf8");
const script = await readFile(new URL("../government-schemes/scheme-ai-voice.js", import.meta.url), "utf8");

test("All India and UP scheme directories load the shared AI voice assistant", () => {
  assert.match(allIndia, /scheme-ai-voice\.js/);
  assert.match(up, /scheme-ai-voice\.js/);
});

test("shared assistant attaches voice and AI actions to every listed scheme card group", () => {
  assert.match(script, /#schemeCards \.scheme/);
  assert.match(script, /#upSchemeCards \.scheme/);
  assert.match(script, /#cards \.card/);
  assert.match(script, /scheme-ai-tools/);
  assert.match(script, /SpeechRecognition/);
  assert.match(script, /speechSynthesis/);
  assert.match(script, /\/api\/jan-seva-assistant/);
});

test("scheme AI prompts are bounded and tell the model not to invent missing eligibility or dates", () => {
  assert.match(script, /MAX_CONTEXT = 850/);
  assert.match(script, /MAX_QUESTION = 520/);
  assert.match(script, /अप्रमाणित|उपलब्ध नहीं|अनुपलब्ध/);
  assert.match(script, /अंतिम नियम आधिकारिक पोर्टल पर जाँचें/);
});

test("scheme pages retain direct official portal links and disclose that not every link is an application form", () => {
  assert.match(allIndia, /आधिकारिक विभाग\/पोर्टल का लिंक/);
  assert.match(allIndia, /जहाँ अलग “Apply” लिंक उपलब्ध नहीं है/);
  assert.match(up, /सीधा आवेदन लिंक होने का दावा नहीं है/);
  assert.match(allIndia, /https:\/\/www\.myscheme\.gov\.in/);
  assert.match(up, /https:\/\/www\.myscheme\.gov\.in/);
});
