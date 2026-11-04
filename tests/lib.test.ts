import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hexlify } from 'ethers';
import { twinOf, h160Of } from '../apps/web/lib/kedge/twin';
import { callPhrase, phraseMatches } from '../apps/web/lib/kedge/phrase';
import { approvedIndexes, delayClock } from '../apps/web/lib/kedge/lookout';
import { checkGroups, checkFinishable, refuseContractInheritor, KedgeRefusal } from '../apps/web/lib/kedge/mate';
import { errorNameFromMessage } from '../apps/web/lib/kedge/helm';
import { assetPrecompile, KUSD_ASSET_ID } from '../apps/web/lib/kedge/constants';
import WORDS from '../apps/web/lib/kedge/words.json';

const p2 = JSON.parse(readFileSync('evidence/probe/part2.json', 'utf8'));
const acct = (n: number) => new Uint8Array(32).fill(n);

test('twin: matches chain output recorded by probe part 2, both directions', () => {
  for (const f of p2.forward) assert.equal(hexlify(twinOf(f.h160)), f.chain);
  for (const r of p2.reverse.filter((x: any) => x.kind === 'eth-twin')) assert.equal(h160Of(Uint8Array.from(Buffer.from(r.account.slice(2), 'hex'))), r.chainH160);
  const sr = p2.reverse.find((x: any) => x.kind === 'sr25519');
  assert.equal(h160Of(Uint8Array.from(Buffer.from(sr.account.slice(2), 'hex'))), sr.chainH160);
  assert.throws(() => twinOf('0x1234'));
});

test('phrase: 2048 distinct words, deterministic, any input change changes it', () => {
  assert.equal(WORDS.length, 2048); assert.equal(new Set(WORDS).size, 2048);
  const a = callPhrase(acct(1), acct(2), 0);
  assert.deepEqual(a, callPhrase(acct(1), acct(2), 0)); assert.equal(a.length, 4);
  assert.notDeepEqual(a, callPhrase(acct(1), acct(3), 0)); // scam link with another inheritor
  assert.notDeepEqual(a, callPhrase(acct(9), acct(2), 0));
  assert.notDeepEqual(a, callPhrase(acct(1), acct(2), 1));
  assert.notDeepEqual(a, callPhrase(acct(1), acct(2), 0, 1));
  assert.ok(phraseMatches('  ' + a.join('   ').toUpperCase() + ' ', a));
  assert.ok(!phraseMatches(a.slice(0, 3).join(' '), a));
});

test('lookout: approvals bitfield equals recorded probe attempt (indexes 0 and 2 after two approvals)', () => {
  assert.deepEqual(approvedIndexes(['5', '0', '0', '0', '0', '0', '0']), [0, 2]);
  assert.deepEqual(approvedIndexes(['4', '0']), [2]);
  assert.deepEqual(approvedIndexes(['0', '1']), [16]);
});
test('lookout: delay clock finishable exactly at init + delay', () => {
  assert.equal(delayClock(316750, 10, 316759).finishable, false);
  assert.equal(delayClock(316750, 10, 316760).finishable, true);
  assert.equal(delayClock(316750, 10, 316755).secondsLeft, 30);
});

const g = (over: object = {}) => ({ friends: [acct(5), acct(6), acct(7)], friendsNeeded: 2, inheritor32: acct(8), inheritanceDelay: 10, priority: 1, cancelDelay: 2, ...over });
test('mate: refusals', async () => {
  const lost = acct(1);
  checkGroups(lost, [g()]);
  const code = (fn: () => void) => { try { fn(); } catch (e: any) { return e.code; } return null; };
  assert.equal(code(() => checkGroups(lost, [])), 'NO_GROUPS');
  assert.equal(code(() => checkGroups(lost, [g({ friends: [lost, acct(6)] })])), 'LOST_IN_GROUP');
  assert.equal(code(() => checkGroups(lost, [g({ friends: [acct(5), acct(5)] })])), 'DUPLICATE_GUARDIAN');
  assert.equal(code(() => checkGroups(lost, [g({ friendsNeeded: 4 })])), 'BAD_THRESHOLD');
  assert.equal(code(() => checkGroups(lost, [g({ friendsNeeded: 0 })])), 'BAD_THRESHOLD');
  assert.equal(code(() => checkGroups(lost, [g({ cancelDelay: 0 })])), 'NO_CANCEL_DELAY');
  assert.equal(code(() => checkGroups(lost, [g(), g()])), 'DUPLICATE_GROUPS');
  assert.equal(code(() => checkFinishable({ finishable: false, blocksLeft: 3 })), 'DELAY_NOT_PASSED');
  const ethTwin = new Uint8Array(32); ethTwin.fill(0xee); ethTwin.set(new Uint8Array(20).fill(7), 0);
  await assert.rejects(() => refuseContractInheritor(ethTwin, async () => '0x6080'), (e: any) => e instanceof KedgeRefusal && e.code === 'INHERITOR_IS_CONTRACT');
  await refuseContractInheritor(ethTwin, async () => '0x'); // EOA ok
  await refuseContractInheritor(acct(3), async () => { throw new Error('must not look up a native account'); }); // sr25519 ok
});

test('helm: error name extracted from the real node message recorded during the build', () => {
  const m = 'Failed to dispatch call: Module(ModuleError { index: 39, error: [2, 0, 0, 0], message: Some("NoPermission") })';
  assert.equal(errorNameFromMessage(m), 'NoPermission');
  assert.equal(errorNameFromMessage('something else'), null);
});
test('constants: precompile address for the test asset matches the deployed vault token', () => {
  const d = JSON.parse(readFileSync('deployments/testnet.json', 'utf8')).AllotmentVault;
  assert.equal(assetPrecompile(KUSD_ASSET_ID).toLowerCase(), d.token.toLowerCase());
});

test('fault switch: KEDGE_SABOTAGE skips exactly the named pre-flight check', async () => {
  const lost = acct(1); const ethTwin = new Uint8Array(32).fill(0xee); ethTwin.set(new Uint8Array(20).fill(7), 0);
  try {
    process.env.KEDGE_SABOTAGE = 'inheritor'; await refuseContractInheritor(ethTwin, async () => '0x6080'); // passes through when sabotaged
    process.env.KEDGE_SABOTAGE = 'sort'; checkGroups(lost, [g({ friends: [acct(5), acct(5)] })]);
    process.env.KEDGE_SABOTAGE = 'delay'; checkFinishable({ finishable: false, blocksLeft: 3 });
    process.env.KEDGE_SABOTAGE = 'delay'; assert.throws(() => checkGroups(lost, [g({ cancelDelay: 0 })]), /cancel delay/); // other checks stay on
  } finally { delete process.env.KEDGE_SABOTAGE; }
  await assert.rejects(() => refuseContractInheritor(ethTwin, async () => '0x6080'));
});
