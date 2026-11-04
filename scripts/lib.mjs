// Shared helpers for probes and the campaign. Keys are read from keys/ (gitignored), never printed.
import { ApiPromise, WsProvider } from '@polkadot/api';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { JsonRpcProvider, Wallet, getBytes, hexlify } from 'ethers';
import { encodeAddress } from '@polkadot/util-crypto';

export const NET = {
  ws: 'wss://test-node-v3.portaldot.dev', http: 'https://test-node-v3.portaldot.dev',
  evm: 'https://test-evm-rpc-v3.portaldot.dev', chainId: 420420777, explorer: 'https://scanner-testnet-v3.portaldot.dev',
};
export const KUSD_ID = 20261104; // Kedge native test asset (pUSD pool is too thin to buy from)
export const assetPrecompile = (id) => '0x' + id.toString(16).padStart(8, '0') + '0'.repeat(24) + '00010000';
export const PALLETS = '0x6d6f646c70792f70616464720000000000000000';
export const twin = (h160) => { const a = getBytes(h160); const o = new Uint8Array(32); o.set(a, 0); o.fill(0xee, 20); return o; };
export const ss58 = (u8) => encodeAddress(u8, 42);
export const loadKey = (name) => JSON.parse(readFileSync(`keys/${name}.json`, 'utf8'));
export async function connect() {
  return ApiPromise.create({ provider: new WsProvider(NET.ws), noInitWarn: true });
}
export const evm = () => new JsonRpcProvider(NET.evm, { chainId: NET.chainId, name: 'portaldot-v3' }, { staticNetwork: true });
export const wallet = (name, provider = evm()) => new Wallet(loadKey(name).privateKey, provider);
export function save(part, obj) {
  mkdirSync('evidence/probe', { recursive: true });
  const rec = { part, at: new Date().toISOString(), ...obj };
  writeFileSync(`evidence/probe/part${part}.json`, JSON.stringify(rec, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 2) + '\n');
  return rec;
}
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export { hexlify, getBytes };

// ---- Helmsman-lite for probes: send an encoded RuntimeCall from an EOA to the pallets address and resolve the
// real Substrate outcome. Never trusts the receipt alone (gasUsed is 0, control_inherited_account returns Ok).
import { keccak256 } from 'ethers';
export async function sendRuntime(api, who, callHex, { value = 0n } = {}) {
  const p = who.provider; const price = (await p.getFeeData()).gasPrice;
  const gas = await p.estimateGas({ from: who.address, to: PALLETS, data: callHex, value });
  const tx = await who.sendTransaction({ to: PALLETS, data: callHex, gasLimit: gas * 13n / 10n, gasPrice: price, value });
  const rc = await tx.wait();
  return { hash: tx.hash, receipt: rc, outcome: await resolve(api, tx.hash, rc) };
}
export async function resolve(api, hash, rc) {
  const bh = await api.rpc.chain.getBlockHash(rc.blockNumber);
  const [signed, events] = await Promise.all([api.rpc.chain.getBlock(bh), api.query.system.events.at(bh)]);
  const xts = signed.block.extrinsics;
  const cands = xts.map((xt, i) => ({ i, section: xt.method.section, method: xt.method.method }))
    .filter((c) => c.section === 'revive' && /ethTransact/i.test(c.method));
  let idx = -1, rule = null;
  for (const c of cands) {
    const payload = xts[c.i].method.args[0].toU8a(true);
    if (keccak256(payload) === hash) { idx = c.i; rule = 'keccak256(ethTransact payload) == eth tx hash'; break; }
  }
  if (idx < 0) { idx = cands[rc.index ?? 0]?.i ?? -1; rule = `FALLBACK by position ${rc.index}`; }
  const mine = events.filter((e) => e.phase.isApplyExtrinsic && e.phase.asApplyExtrinsic.toNumber() === idx);
  return { block: rc.blockNumber, blockHash: bh.toHex(), extrinsicIndex: idx, matchRule: rule, ethTransactCountInBlock: cands.length,
    events: mine.map((e) => decodeEvent(api, e)) };
}
export function decodeEvent(api, e) {
  const { section, method } = e.event; const data = e.event.data.toHuman();
  let out = { event: `${section}.${method}`, data };
  if ((section === 'system' && method === 'ExtrinsicFailed') || (section === 'revive' && method === 'EthExtrinsicRevert')) {
    const de = e.event.data[0]; if (de.isModule) { const m = api.registry.findMetaError(de.asModule); out.error = `${m.section}.${m.name}`; }
  }
  return out;
}
