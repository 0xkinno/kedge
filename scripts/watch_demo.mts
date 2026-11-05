#!/usr/bin/env -S npx tsx
// Watchkeeper demonstration on the live chain. File sink (no Telegram token available in this environment): labelled as such.
// 1 owner signs an EIP-191 subscription, POSTed to /api/watch. 2 watch job sets its cursor. 3 a guardian starts an attempt on chain.
// 4 the job runs again and must produce exactly one alert. Also proves /api/watch refuses an unsigned request.
import { JsonRpcProvider, Wallet } from 'ethers';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { NET } from '../packages/kedge-kit/src/constants';
import { twinOf } from '../packages/kedge-kit/src/twin';
import * as P from '../packages/kedge-kit/src/purser';
import { sendRuntimeCall, resolveOutcome } from '../packages/kedge-kit/src/helm';
import { subscriptionMessage } from '../watch/core.mjs';
const BASE = process.env.BASE ?? 'http://localhost:3100'; const STORE = '/tmp/kedge-store.json';
const provider = new JsonRpcProvider(NET.evmRpc, { chainId: NET.chainId, name: 'portaldot-v3' }, { staticNetwork: true }); const rpc = (m: string, p: unknown[]) => provider.send(m, p);
const key = (n: string) => JSON.parse(readFileSync(`keys/${n}.json`, 'utf8')); const w = (n: string) => new Wallet(key(n).privateKey, provider);
const a = await P.api(); const owner = Wallet.createRandom().connect(provider); const lost32 = twinOf(owner.address);
mkdirSync('evidence/watch', { recursive: true }); rmSync('evidence/watch/alerts.jsonl', { force: true }); rmSync(STORE, { force: true });
const send = async (signer: any, hex: string) => { const eth = { request: async ({ params }: any) => (await signer.sendTransaction({ to: params[0].to, data: params[0].data, gasLimit: params[0].gas, gasPrice: params[0].gasPrice, value: 0n })).hash };
  const h = await sendRuntimeCall(eth, rpc, signer.address, hex, () => {}); return resolveOutcome(a, rpc, h); };
await (await w('drill-lifeboat').sendTransaction({ to: owner.address, value: 1_200_000_000_000_000_000n, gasLimit: 6_000_000_000_000n, gasPrice: (await provider.getFeeData()).gasPrice! })).wait();
await send(owner, await P.setFriendGroups([{ friends: [twinOf(w('drill-lorna').address), twinOf(w('drill-ben').address)], friendsNeeded: 2, inheritor32: twinOf(w('drill-lifeboat').address), inheritanceDelay: 10, priority: 1, cancelDelay: 2 }]));
// unsigned subscription must be refused
const unsigned = await fetch(`${BASE}/api/watch`, { method: 'POST', body: JSON.stringify({ address: owner.address, chatId: '123456789', nonce: 'n0' }) });
// signed subscription accepted
const nonce = 'n1'; const sig = await owner.signMessage(subscriptionMessage(owner.address, '123456789', nonce));
const signed = await fetch(`${BASE}/api/watch`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ address: owner.address, chatId: '123456789', nonce, signature: sig }) });
const head = (await a.rpc.chain.getHeader()).number.toNumber();
const run = (extra: string[]) => execFileSync('node', ['watch/run.mjs', '--once', '--sink', 'file', ...extra], { env: { ...process.env, KEDGE_STORE_FILE: STORE, APP_URL: 'https://kedge.example' }, encoding: 'utf8' }).split('\n').filter((l) => l.startsWith('20'));
const first = run(['--from', String(head)]);
const o = await send(w('drill-lorna'), await P.initiate(lost32, 0)); // the attempt, started while "nobody is watching"
const second = run([]); const third = run([]);
const alerts = existsSync('evidence/watch/alerts.jsonl') ? readFileSync('evidence/watch/alerts.jsonl', 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
const rec = { at: new Date().toISOString(), sink: 'file (no Telegram bot token available in this environment; labelled)', owner: owner.address,
  unsignedSubscriptionStatus: unsigned.status, signedSubscriptionStatus: signed.status, attemptBlock: o.block, attemptExplorer: o.explorer, attemptEvents: o.events.map((e) => e.event),
  runs: { beforeAttempt: first, afterAttempt: second, repeat: third }, alertsDelivered: alerts.length, alertText: alerts[0]?.text,
  pass: unsigned.status === 401 && signed.status === 200 && alerts.length === 1 && alerts[0].alert.kind === 'initiated' };
writeFileSync('evidence/watch/demo-run.json', JSON.stringify(rec, null, 2) + '\n'); console.log(JSON.stringify(rec, null, 1)); await P.closeApi(); process.exit(rec.pass ? 0 : 1);
