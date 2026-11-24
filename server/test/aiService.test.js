import test from 'node:test';
import assert from 'node:assert/strict';
import { mockSummary, fallbackSummary } from '../src/services/aiService.js';

const content = {
  body: 'The first sentence gives context. The second adds detail. The third provides evidence. The fourth closes the argument.'
};

test('mock summaries respect the requested length', () => {
  const short = mockSummary(content.body, { tone: 'neutral', length: 'short' });
  const long = mockSummary(content.body, { tone: 'neutral', length: 'long' });
  assert.ok(short.length < long.length);
  assert.match(short, /second adds detail\./);
  assert.doesNotMatch(short, /third provides evidence/);
});

test('tone changes the summary prefix', () => {
  assert.match(mockSummary(content.body, { tone: 'professional', length: 'short' }), /^Summary:/);
  assert.match(mockSummary(content.body, { tone: 'friendly', length: 'short' }), /^In brief:/);
});

test('fallback is always a short neutral result', () => {
  const result = fallbackSummary(content);
  assert.match(result, /first sentence/);
  assert.doesNotMatch(result, /third provides evidence/);
});
