import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/civic-ai.js';

function request(payload, headers = { 'content-type': 'application/json' }) {
  return new Request('https://kagzi.test/api/civic-ai', {
    method: 'POST', headers, body: JSON.stringify(payload)
  });
}

test('shared civic AI rejects non-JSON requests', async () => {
  const response = await onRequestPost({ request: request({}, { 'content-type': 'text/plain' }), env: {} });
  assert.equal(response.status, 415);
});

test('shared civic AI validates prompt and feature scope', async () => {
  const response = await onRequestPost({ request: request({ feature: 'family', prompt: 'hello' }), env: { AI: { run() {} } } });
  assert.equal(response.status, 400);
});

test('shared civic AI returns a clear configuration error when Workers AI is unavailable', async () => {
  const response = await onRequestPost({ request: request({ feature: 'legal', prompt: 'आवेदन लिखें' }), env: {} });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, 'AI_NOT_CONFIGURED');
});

test('shared civic AI sends scoped bilingual prompt to Workers AI and returns its answer', async () => {
  let captured;
  const env = { AI: { async run(model, input) {
    captured = { model, input };
    return { response: 'यह आपका प्रारूप है।' };
  } } };
  const response = await onRequestPost({ request: request({ feature: 'legal', prompt: 'पानी की समस्या पर आवेदन लिखें' }), env });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).reply, 'यह आपका प्रारूप है।');
  assert.equal(captured.model, '@cf/zai-org/glm-4.7-flash');
  assert.ok(captured.input.messages.some(message => message.role === 'user' && message.content.includes('पानी की समस्या')));
  assert.match(captured.input.messages[0].content, /कानूनी सलाह नहीं/);
});

test('shared civic AI never accepts family dashboard scope', async () => {
  const response = await onRequestPost({ request: request({ feature: 'family', prompt: 'family dashboard' }), env: { AI: { run() {} } } });
  assert.equal(response.status, 400);
});

test('shared civic AI frontend is available to all civic tools without exposing secrets', async () => {
  const { readFile } = await import('node:fs/promises');
  const client = await readFile(new URL('../civic-ai.js', import.meta.url), 'utf8');
  for (const page of ['legal-document-generator.html', 'public-complaints.html', 'gram-panchayat.html']) {
    const html = await readFile(new URL('../' + page, import.meta.url), 'utf8');
    assert.match(html, /civic-ai\.js/);
  }
  assert.match(client, /\/api\/civic-ai/);
  assert.ok(client.includes(String.raw`replace(/\.html?$/i, "")`), "clean-URL routes must map to the shared AI feature");
  assert.doesNotMatch(client, /Bearer\s+[A-Za-z0-9_-]{16,}/);
});
