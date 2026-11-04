#!/usr/bin/env node
// Keyless: re-reads every recorded tx from the public node and checks docs/FACTS.json against the evidence.
// Run with: npm run verify
import { readFileSync } from 'node:fs';
import { connect, evm, resolve } from './lib.mjs';
import { buildFacts } from './facts.mjs';
const facts = JSON.parse(readFileSync('docs/FACTS.json', 'utf8'));
let bad = 0; const fail = (m) => { console.log('FAIL', m); bad++; };
const fresh = buildFacts();
if (JSON.stringify(fresh) !== JSON.stringify(facts)) fail('docs/FACTS.json does not match evidence/ (run: node scripts/facts.mjs)');
const api = await connect(); const p = evm();
let n = 0;
for (const t of facts.txs) {
  if (/native extrinsic|native sr25519/.test(t.label)) { // a native extrinsic, not an Ethereum transaction: match by extrinsic hash in its block
    const bh = await api.rpc.chain.getBlockHash(t.block); const [blk, evs] = await Promise.all([api.rpc.chain.getBlock(bh), api.query.system.events.at(bh)]);
    const i = blk.block.extrinsics.findIndex((x) => x.hash.toHex() === t.hash);
    if (i < 0) { fail(`${t.scenario} ${t.label}: extrinsic not in block ${t.block}`); continue; }
    const okEv = evs.some((e) => e.phase.isApplyExtrinsic && e.phase.asApplyExtrinsic.toNumber() === i && e.event.section === 'system' && e.event.method === 'ExtrinsicSuccess');
    if (okEv !== t.ok) fail(`${t.scenario} ${t.label}: recorded ok=${t.ok} but chain says ${okEv}`); n++; continue;
  }
  const rc = await p.getTransactionReceipt(t.hash);
  if (!rc) { fail(`${t.scenario} ${t.label}: receipt not found`); continue; }
  if (rc.blockNumber !== t.block) fail(`${t.scenario} ${t.hash}: block ${rc.blockNumber} != ${t.block}`);
  const r = await resolve(api, t.hash, rc);
  if (r.matchRule.startsWith('FALLBACK')) fail(`${t.hash}: extrinsic not matched by hash`);
  const failed = r.events.find((e) => e.event === 'system.ExtrinsicFailed' || e.event === 'revive.EthExtrinsicRevert');
  if (t.ok === !!failed) fail(`${t.scenario} ${t.label}: recorded ok=${t.ok} but chain says failed=${!!failed}`);
  if (!t.ok && failed?.error !== t.error) fail(`${t.scenario} ${t.label}: error ${failed?.error} != ${t.error}`);
  n++;
}
const v = (await p.getCode(facts.vault.address)); if (!v || v === '0x') fail('vault has no code');
console.log(`verified ${n} of ${facts.txs.length} transactions against the public node; vault code present: ${v.length > 2}`);
await api.disconnect(); console.log(bad ? `${bad} problem(s)` : 'ALL CHECKS PASSED'); process.exit(bad ? 1 : 0);
