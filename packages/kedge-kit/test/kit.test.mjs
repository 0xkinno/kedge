import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import * as esm from '../dist/index.js';
const require = createRequire(import.meta.url);
const cjs = require('../dist/index.cjs');
const acct = (n) => new Uint8Array(32).fill(n);
const hex = (u) => '0x' + Buffer.from(u).toString('hex');

test('ESM and CJS builds export the same public surface', () => {
  const want = ['twinOf', 'h160Of', 'callPhrase', 'phraseMatches', 'setFriendGroups', 'initiate', 'approve', 'finish', 'cancel', 'slash', 'bringHome', 'sendRuntimeCall', 'resolveOutcome', 'checkGroups', 'refuseContractInheritor', 'KedgeRefusal', 'delayClock', 'scale', 'PALLETS_ADDRESS'];
  for (const k of want) { assert.ok(k in esm, `esm missing ${k}`); assert.ok(k in cjs, `cjs missing ${k}`); }
});

test('twin rule round trip and the pallets address', () => {
  const h = '0x85fbBA0fD74dAd192A277DCF5e8B83DA96FCA816';
  const t = esm.twinOf(h); assert.equal(t.length, 32); assert.ok(t.slice(20).every((b) => b === 0xee));
  assert.equal(esm.h160Of(t).toLowerCase(), h.toLowerCase());
  assert.equal(esm.PALLETS_ADDRESS, '0x6d6f646c70792f70616464720000000000000000');
});

test('call phrase is deterministic and changes with any input', () => {
  const a = esm.callPhrase(acct(1), acct(2), 0);
  assert.deepEqual(a, cjs.callPhrase(acct(1), acct(2), 0)); assert.equal(a.length, 4);
  assert.notDeepEqual(a, esm.callPhrase(acct(1), acct(3), 0));
  assert.ok(esm.phraseMatches(a.join('  ').toUpperCase(), a));
});

test('refusals: duplicate guardian and a contract inheritor', async () => {
  const g = { friends: [acct(5), acct(5)], friendsNeeded: 2, inheritor32: acct(8), inheritanceDelay: 10, priority: 1, cancelDelay: 2 };
  assert.throws(() => esm.checkGroups(acct(1), [g]), (e) => e instanceof esm.KedgeRefusal && e.code === 'DUPLICATE_GUARDIAN');
  const heir = new Uint8Array(32).fill(0xee); heir.set(new Uint8Array(20).fill(7), 0);
  await assert.rejects(() => esm.refuseContractInheritor(heir, async () => '0x6080'), (e) => e.code === 'INHERITOR_IS_CONTRACT');
});

test('dependency-free encoder builds the Recovery calls without polkadot.js', () => {
  const call = esm.scale.setFriendGroups([{ friends: [hex(acct(5)), hex(acct(6))], friendsNeeded: 2, inheritor: hex(acct(8)), inheritanceDelay: 10, inheritancePriority: 1, cancelDelay: 2 }]);
  assert.match(call, /^0x1e02/); // pallet 30, call 2
  assert.match(esm.scale.initiateAttempt(hex(acct(1)), 0), /^0x1e03/);
  assert.equal(esm.scale.initiateAttempt(hex(acct(1)), 0), cjs.scale.initiateAttempt(hex(acct(1)), 0));
});

test('LIVE (opt-in, KEDGE_LIVE=1): purser output equals the dependency-free encoder on live metadata', { skip: process.env.KEDGE_LIVE !== '1' }, async () => {
  const spec = { friends: [acct(7), acct(5), acct(6)], friendsNeeded: 2, inheritor32: acct(8), inheritanceDelay: 10, priority: 1, cancelDelay: 2 };
  const viaPolkadot = await esm.setFriendGroups([spec]);
  const viaScale = esm.scale.setFriendGroups([{ friends: [hex(acct(5)), hex(acct(6)), hex(acct(7))], friendsNeeded: 2, inheritor: hex(acct(8)), inheritanceDelay: 10, inheritancePriority: 1, cancelDelay: 2 }]);
  assert.equal(viaPolkadot, viaScale); await esm.closeApi();
});
