#!/usr/bin/env node
// Watchkeeper job. Keyless: it reads the chain and sends alerts. It holds no signing key.
// Usage: node watch/run.mjs [--once] [--seconds 3300] [--from <block>] [--sink telegram|file]
import { ApiPromise, WsProvider } from '@polkadot/api';
import { mkdirSync, appendFileSync } from 'node:fs';
import { storeFromEnv } from './store.mjs';
import { alertsFromEvents, deliver } from './core.mjs';

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1] ?? true; };
const WS = process.env.SUBSTRATE_WS ?? 'wss://test-node-v3.portaldot.dev';
const APP = process.env.APP_URL ?? 'https://kedge.vercel.app';
const store = storeFromEnv();
const telegramSink = async ({ chatId, text }) => {
  const r = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text }) });
  if (!r.ok) throw new Error(`telegram ${r.status}`);
};
const fileSink = async (m) => { mkdirSync('evidence/watch', { recursive: true }); appendFileSync('evidence/watch/alerts.jsonl', JSON.stringify({ at: new Date().toISOString(), ...m }) + '\n'); console.log('ALERT (file sink):', m.text.split('\n')[0]); };
const sink = (arg('sink', process.env.TELEGRAM_BOT_TOKEN ? 'telegram' : 'file') === 'telegram') ? telegramSink : fileSink;

export async function subscriptions() { const m = new Map(); for (const [, v] of await store.list('kedge:sub:')) { const s = typeof v === 'string' ? JSON.parse(v) : v; m.set(s.lostSs58, s); } return m; }

async function tick(api) {
  const head = (await api.rpc.chain.getHeader()).number.toNumber();
  let cursor = Number((await store.get('kedge:cursor')) ?? arg('from', head - 1));
  const subs = await subscriptions(); let sent = 0;
  const to = Math.min(head, cursor + 200);
  for (let n = cursor + 1; n <= to; n++) {
    const bh = await api.rpc.chain.getBlockHash(n); const evs = await api.query.system.events.at(bh);
    const events = evs.map((e, i) => ({ block: n, index: i, section: e.event.section, method: e.event.method, data: Object.fromEntries(e.event.data.map((d, j) => [e.event.data.names?.[j] ?? j, d.toHuman?.() ?? d])) }))
      .filter((e) => e.section === 'recovery');
    const alerts = alertsFromEvents(events, subs, (lost, gi, blk) => null);
    sent += await deliver(alerts, store, sink, APP, head);
    await store.set('kedge:cursor', String(n));
  }
  return { head, scanned: Math.max(0, to - cursor), sent, subs: subs.size };
}
const api = await ApiPromise.create({ provider: new WsProvider(WS), noInitWarn: true });
const end = Date.now() + Number(arg('seconds', 3300)) * 1000;
do { const r = await tick(api); console.log(new Date().toISOString(), JSON.stringify(r)); if (arg('once', false)) break; await new Promise((res) => setTimeout(res, 30_000)); } while (Date.now() < end);
await api.disconnect(); process.exit(0);
