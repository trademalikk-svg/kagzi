import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequestPost } from '../functions/api/jan-seva-assistant.js';

test('rejects an empty Jan Seva question', async () => {
  const response = await onRequestPost({ request: new Request('https://kagzi.test/api/jan-seva-assistant', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: '' })
  }), env: {} });
  assert.equal(response.status, 400);
});

test('keeps directory fallback available when Workers AI is not configured', async () => {
  const response = await onRequestPost({ request: new Request('https://kagzi.test/api/jan-seva-assistant', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: 'निवास प्रमाणपत्र की जानकारी' })
  }), env: {} });
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, 'AI_NOT_CONFIGURED');
});

test('returns the AI reply when the Workers AI binding responds', async () => {
  const response = await onRequestPost({ request: new Request('https://kagzi.test/api/jan-seva-assistant', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: 'निवास प्रमाणपत्र' })
  }), env: { AI: { run: async () => ({ response: 'UP e-District पोर्टल देखें।' }) } } });
  assert.equal(response.status, 200);
  assert.match((await response.json()).reply, /e-District/);
});
