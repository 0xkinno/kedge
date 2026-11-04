import { keccak256 } from 'ethers';
import type { ApiPromise } from '@polkadot/api';
import { NET, PALLETS_ADDRESS, explorerBlock } from './constants';

export type Eip1193 = { request: (a: { method: string; params?: unknown[] }) => Promise<any> };
export type EvmRpc = (method: string, params: unknown[]) => Promise<any>;
export type PendingStore = (hash: string, callHex: string) => void;

export class ChainRefusal extends Error {
  constructor(public errorName: string, msg: string) { super(msg); }
}
/** The node reports a failing dry run as: Module(ModuleError { ... message: Some("NotYetInheritable") }). */
export function errorNameFromMessage(m: string): string | null {
  const r = /message: Some\("([A-Za-z]+)"\)/.exec(m); return r ? r[1] : null;
}

/** Send a RuntimeCall from the person's own wallet. Persist the hash BEFORE waiting. Never hard-code gas. */
export async function sendRuntimeCall(eth: Eip1193, rpc: EvmRpc, from: string, callHex: string, persist: PendingStore, opts: { forceGas?: string } = {}) {
  let gas = opts.forceGas;
  if (!gas) {
    try { gas = await rpc('eth_estimateGas', [{ from, to: PALLETS_ADDRESS, data: callHex }]); }
    catch (e: any) {
      const name = errorNameFromMessage(String(e?.message ?? e)) ?? 'DISPATCH_FAILED';
      throw new ChainRefusal(name, `The chain would refuse this call: ${name}`);
    }
  }
  const gasPrice = await rpc('eth_gasPrice', []);
  const hash: string = await eth.request({ method: 'eth_sendTransaction',
    params: [{ from, to: PALLETS_ADDRESS, data: callHex, gas, gasPrice, value: '0x0', chainId: NET.chainIdHex }] });
  persist(hash, callHex);
  return hash;
}

export async function pollReceipt(rpc: EvmRpc, hash: string, { timeoutMs = 600_000, everyMs = 3_000 } = {}) {
  const t0 = Date.now();
  for (;;) {
    const r = await rpc('eth_getTransactionReceipt', [hash]);
    if (r) return r as { blockNumber: string; status: string; transactionIndex: string };
    if (Date.now() - t0 > timeoutMs) throw new Error('receipt timeout: the transaction may still land, check the explorer');
    await new Promise((res) => setTimeout(res, everyMs));
  }
}

export type KedgeEvent = { event: string; data: any; error?: string };
export type Outcome = {
  block: number; blockHash: string; extrinsicIndex: number; matchRule: string; explorer: string;
  extrinsicFailed: boolean; errorName?: string; events: KedgeEvent[];
  controlResult?: 'Ok' | { Err: any }; items: { status: 'completed' | 'failed'; error?: string }[];
};

const modErr = (api: ApiPromise, de: any): string => {
  try { if (de.isModule) { const m = api.registry.findMetaError(de.asModule); return `${m.section}.${m.name}`; } return de.type ?? de.toString(); } catch { return 'Unknown'; }
};

/** Never trust the receipt alone: gasUsed is 0 and control_inherited_account always returns Ok.
 *  Find the extrinsic by keccak256(ethTransact payload) == Ethereum hash (verified 9 of 9, PLATFORM_PROBE part 9). */
export async function resolveOutcome(api: ApiPromise, rpc: EvmRpc, hash: string, timeoutMs = 600_000): Promise<Outcome> {
  const r = await pollReceipt(rpc, hash, { timeoutMs });
  const n = parseInt(r.blockNumber, 16);
  const bh = await api.rpc.chain.getBlockHash(n);
  const [blk, evs] = await Promise.all([api.rpc.chain.getBlock(bh), api.query.system.events.at(bh)]) as [any, any];
  const xts = blk.block.extrinsics;
  let idx = -1;
  xts.forEach((xt: any, i: number) => { if (idx < 0 && xt.method.section === 'revive' && /ethTransact/i.test(xt.method.method) && keccak256(xt.method.args[0].toU8a(true)) === hash) idx = i; });
  const rule = idx >= 0 ? 'keccak256(ethTransact payload) == eth tx hash' : 'NOT FOUND';
  const mine = (evs as any as any[]).filter((e: any) => e.phase.isApplyExtrinsic && e.phase.asApplyExtrinsic.toNumber() === idx);
  const events: KedgeEvent[] = mine.map((e) => {
    const { section, method } = e.event; const out: KedgeEvent = { event: `${section}.${method}`, data: e.event.data.toHuman() };
    if (section === 'system' && method === 'ExtrinsicFailed') out.error = modErr(api, e.event.data[0]);
    if (section === 'utility' && method === 'ItemFailed') out.error = modErr(api, e.event.data[0]);
    return out;
  });
  const failed = events.find((e) => e.event === 'system.ExtrinsicFailed');
  const ctl = events.find((e) => e.event === 'recovery.RecoveredAccountControlled');
  const items = events.filter((e) => /^utility\.Item(Completed|Failed)$/.test(e.event))
    .map((e) => (e.event.endsWith('Completed') ? { status: 'completed' as const } : { status: 'failed' as const, error: e.error }));
  return { block: n, blockHash: bh.toHex(), extrinsicIndex: idx, matchRule: rule, explorer: explorerBlock(n), extrinsicFailed: !!failed,
    errorName: failed?.error, events, controlResult: ctl ? (ctl.data.callResult ?? ctl.data.call_result) : undefined, items };
}
