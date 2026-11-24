import { randomBytes } from 'node:crypto';

export function mockTransactionHash(prefix = '') {
  return `0x${prefix}${randomBytes(24).toString('hex')}`;
}
