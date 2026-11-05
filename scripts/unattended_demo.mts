#!/usr/bin/env -S npx tsx
// Unattended Watchkeeper alert, real Telegram. Needs env: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, CHAT_ID, BASE.
// Order: the GitHub Actions job must already be running (its cursor exists in Upstash); only then is the attempt started.
import { JsonRpcProvider, Wallet } from 'ethers';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { NET } from '../packages/kedge-kit/src/constants';
import { twinOf } from '../packages/kedge-kit/src/twin';
import * as P from '../packages/kedge-kit/src/purser';
import { sendRuntimeCall, resolveOutcome } from '../packages/kedge-kit/src/helm';
import { subscriptionMessage } from '../watch/core.mjs';
const { UPSTASH_REDIS_REST_URL: U, UPSTASH_REDIS_REST_TOKEN: T, CHAT_ID, BASE = 'https://kedge-kinnoskis-projects.vercel.app' } = process.env as Record<string, string>;
const redis = async (...a: string[]) => (await (await fetch(U, { method: 'POST', headers: { authorization: `Bearer ${T}`, 'content-type': 'application/json' }, body: JSON.stringify(a) })).json()).result;
const provider = new JsonRpcProvider(NET.evmRpc, { chainId: NET.chainId, name: 'portaldot-v3' }, { staticNetwork: true }); const rpc = (m: string, p: unknown[]) => provider.send(m, p);
const key = (n: string) => JSON.parse(readFileSync(`keys/${n}.json`, 'utf8')); const w = (n: string) => new Wallet(key(n).privateKey, provider);
const a = await P.api(); const owner = Wallet.createRandom().connect(provider); const lost32 = twinOf(owner.address);
const send = async (s: any, hex: string) => { const eth = { request: async ({ params }: any) => (await s.sendTransaction({ to: params[0].to, data: params[0].data, gasLimit: params[0].gas, gasPrice: params[0].gasPrice, value: 0n })).hash }; return resolveOutcome(a, rpc, await sendRuntimeCall(eth, rpc, s.address, hex, () => {})); };
await (await w('drill-lifeboat').sendTransaction({ to: owner.address, value: 1_200_000_000_000_000_000n, gasLimit: 6_000_000_000_000n, gasPrice: (await provider.getFeeData()).gasPrice! })).wait();
await send(owner, await P.setFriendGroups([{ friends: [twinOf(w('drill-lorna').address), twinOf(w('drill-ben').address)], friendsNeeded: 2, inheritor32: twinOf(w('drill-lifeboat').address), inheritanceDelay: 10, priority: 1, cancelDelay: 2 }]));
const nonce = 'tg1'; const sig = await owner.signMessage(subscriptionMessage(owner.address, CHAT_ID, nonce));
const sub = await fetch(`${BASE}/api/watch`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ address: owner.address, chatId: CHAT_ID, nonce, signature: sig }) });
console.log('subscription', sub.status, await sub.text());
console.log('waiting for the Actions job to set its cursor...');
let cursor: string | null = null; for (let i = 0; i < 60 && !cursor; i++) { cursor = await redis('GET', 'kedge:cursor'); if (!cursor) await new Promise((r) => setTimeout(r, 10000)); }
if (!cursor) { console.error('job never set a cursor'); process.exit(2); }
console.log('job is running, cursor', cursor);
const o = await send(w('drill-lorna'), await P.initiate(lost32, 0)); console.log('attempt started at block', o.block, o.explorer);
let sent: string[] = []; for (let i = 0; i < 24 && !sent.length; i++) { await new Promise((r) => setTimeout(r, 10000)); const keys = await redis('KEYS', `kedge:sent:${o.block}:*`); sent = keys ?? []; }
const rec = { at: new Date().toISOString(), owner: owner.address, chatIdSet: !!CHAT_ID, subscriptionStatus: sub.status, cursorWhenAttemptStarted: cursor, attemptBlock: o.block, attemptExplorer: o.explorer, alertDedupeKeys: sent, jobDispatch: 'workflow_dispatch of .github/workflows/watchkeeper.yml (HTTP 204)', delivered: sent.length > 0, note: 'The dedupe key is written just before the Telegram call. Delivery itself is confirmed by the screenshot docs/demo/telegram-alert.png from the receiving phone.' };
mkdirSync('evidence/watch', { recursive: true }); writeFileSync('evidence/watch/unattended-run.json', JSON.stringify(rec, null, 2) + '\n'); console.log(JSON.stringify(rec, null, 1)); await P.closeApi(); process.exit(rec.delivered ? 0 : 1);
