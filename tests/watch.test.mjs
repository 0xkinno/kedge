import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { Wallet } from 'ethers';
import { alertsFromEvents, deliver, formatAlert, subscriptionMessage, verifySubscription } from '../watch/core.mjs';
import { fileStore } from '../watch/store.mjs';

const LOST = '5F6P1CjuaRxpuztZKBqDWqUTH8miLNs76icUzHCSFRGLHNvF'; const LORNA = '5Hf3YZyL6EUBqSiF7CqJKGwd2b2mVtWCRR46sVGs1oNU7udh';
const subs = new Map([[LOST, { chatId: '12345', address: '0xabc' }]]);
const ev = (method, data, block = 100, index = 3) => ({ block, index, section: 'recovery', method, data });

test('alerts: only for subscribed accounts, one per event', async () => {
  const events = [ev('AttemptInitiated', { lost: LOST, friend_group_index: '0', initiator: LORNA }), ev('AttemptInitiated', { lost: 'someoneElse', friend_group_index: '0', initiator: LORNA }, 100, 4), { block: 100, index: 5, section: 'balances', method: 'Transfer', data: {} }];
  const alerts = alertsFromEvents(events, subs); assert.equal(alerts.length, 1); assert.equal(alerts[0].kind, 'initiated');
  const store = fileStore(`/tmp/claude-0/watch-test-${Date.now()}.json`); const sent = [];
  assert.equal(await deliver([...alerts, ...alerts], store, async (m) => sent.push(m), 'https://app.test', 90), 1, 'duplicate event must not send twice');
  assert.equal(await deliver(alerts, store, async (m) => sent.push(m), 'https://app.test', 90), 0, 'a later tick must not resend');
  assert.match(sent[0].text, /harbour\?act=stop/); assert.match(sent[0].text, /harbour\?act=slash/);
});
test('alerts: finish and control events are reported', () => {
  const a = alertsFromEvents([ev('AttemptFinished', { lost: LOST, friend_group_index: '0', inheritor: LORNA }), ev('RecoveredAccountControlled', { recovered: LOST, inheritor: LORNA }, 101, 1)], subs);
  assert.deepEqual(a.map((x) => x.kind), ['finished', 'controlled']);
  assert.ok(formatAlert(a[0], 'https://app.test').includes('finished'));
});
test('subscription: unsigned is refused, wrong signer refused, correct EIP-191 signature accepted', async () => {
  const w = Wallet.createRandom(); const nonce = 'n1'; const chatId = '987654';
  assert.throws(() => verifySubscription({ address: w.address, chatId, nonce }), /unsigned/);
  const sig = await w.signMessage(subscriptionMessage(w.address, chatId, nonce));
  assert.equal(verifySubscription({ address: w.address, chatId, nonce, signature: sig }).toLowerCase(), w.address.toLowerCase());
  const other = Wallet.createRandom(); const badSig = await other.signMessage(subscriptionMessage(w.address, chatId, nonce));
  assert.throws(() => verifySubscription({ address: w.address, chatId, nonce, signature: badSig }), /does not match/);
  assert.throws(() => verifySubscription({ address: w.address, chatId: 'abc', nonce, signature: sig }), /bad chat id/);
});
test('keyless: no key material in watch/ or the workflow', () => {
  const files = readdirSync('watch').map((f) => `watch/${f}`).concat(['.github/workflows/watchkeeper.yml']);
  for (const f of files) { const t = readFileSync(f, 'utf8');
    assert.ok(!/PRIVATE_KEY|_PK\b|DRILL_|mnemonic|seed phrase|0x[0-9a-fA-F]{64}\b/.test(t), `${f} must not mention key material`);
    assert.ok(!/privateKey|signTransaction|sendTransaction|Wallet\(/.test(t.replace(/Wallet\.createRandom|import \{[^}]*Wallet[^}]*\}/g, '')), `${f} must not sign`); }
  const wf = readFileSync('.github/workflows/watchkeeper.yml', 'utf8');
  assert.ok(!/secrets\.(?!UPSTASH_REDIS_REST_URL|UPSTASH_REDIS_REST_TOKEN|TELEGRAM_BOT_TOKEN)\w+/.test(wf), 'workflow may only reference the three alerting secrets');
});

test('alerts: reads the camelCase field names polkadot.js produces, so the group number is never NaN', () => {
  const a = alertsFromEvents([ev('AttemptInitiated', { lost: LOST, friendGroupIndex: '2', initiator: LORNA })], subs);
  assert.equal(a[0].group, 2); assert.ok(!formatAlert(a[0], 'https://app.test').includes('NaN'));
  const b = alertsFromEvents([ev('AttemptInitiated', { lost: LOST, friend_group_index: '1', initiator: LORNA })], subs); assert.equal(b[0].group, 1);
});
test('alerts: the message says when the attempt becomes finishable', () => {
  const a = alertsFromEvents([ev('AttemptInitiated', { lost: LOST, friendGroupIndex: '0', initiator: LORNA })], subs, () => 110)[0];
  assert.match(formatAlert(a, 'https://app.test', 6, 100), /block 110, about 60 seconds/);
});
