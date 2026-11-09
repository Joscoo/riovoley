'use strict';
// Synthetic metadata only; these records are not execution receipts.
const { test } = require('node:test'), assert = require('node:assert/strict');
const { pickLatestAttempt } = require('../../scripts/audit/maintenance/packet-context.cjs');
const older = { file: 'integracion/intento-final.json', recordedAt: '2026-11-09T14:00:00.000Z', completed: true };
const newer = { file: 'integracion/intento-final-100-abc.json', recordedAt: '2026-11-09T15:00:00.000Z', completed: true };
test('selects newer successful attempt instead of canonical older filename without mutating inputs', () => {
  const input = [older, newer]; assert.equal(pickLatestAttempt(input), newer); assert.deepEqual(input, [older, newer]);
  assert.equal(pickLatestAttempt([newer, older]), newer);
});
test('rejects paths outside owned final-attempt namespace', () => {
  assert.throws(() => pickLatestAttempt([{ ...newer, file: '../intento-final.json' }]));
});
test('rejects missing, incomplete or invalid-date final evidence', () => {
  assert.throws(() => pickLatestAttempt([])); assert.throws(() => pickLatestAttempt([{ ...newer, completed: false }]));
  assert.throws(() => pickLatestAttempt([{ ...newer, recordedAt: 'invalid' }]));
});
