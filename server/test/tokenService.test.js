import test from 'node:test';
import assert from 'node:assert/strict';
import { RATES, TOKEN_REWARD } from '../src/services/tokenService.js';

test('a successful AI run awards the configured amount', () => {
  assert.equal(TOKEN_REWARD, 5);
});

test('mock conversion rates match the assessment examples', () => {
  assert.equal(100 * RATES.MOCK_USDT, 1);
  assert.equal(200 * RATES.MOCK_ETH, 0.01);
});
