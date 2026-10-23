import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';

test('token generator creates 48 bytes base64url', () => {
  const token = crypto.randomBytes(48).toString('base64url');
  assert.equal(token.length, 64);
  assert.match(token, /^[A-Za-z0-9_-]+$/);
});

test('constant time token comparison works', () => {
  const secretA = 'secret-test-token-12345678901234567890';
  const secretB = 'secret-test-token-12345678901234567890';
  const secretC = 'secret-test-token-wrong-character-here';
  
  assert.equal(crypto.timingSafeEqual(Buffer.from(secretA), Buffer.from(secretB)), true);
  assert.equal(crypto.timingSafeEqual(Buffer.from(secretA), Buffer.from(secretC)), false);
});
