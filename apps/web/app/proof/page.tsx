'use client';
import { useEffect, useMemo, useState } from 'react';
import facts from '@/data/FACTS.json';
import { NET } from '@/lib/kedge/constants';
import { resolveOutcome } from '@/lib/kedge/helm';
import { PrimaryButton, GhostButton, GlowCard, Notice } from '@/components/ui';

type R = { state: 'idle' | 'run' | 'done' | 'err'; out?: any; before?: string; after?: string; msg?: string };
export default function Proof() {
  const [filter, setFilter] = useState('all'); const [res, setRes] = useState<Record<string, R>>({});
  const txs = useMemo(() => facts.txs.filter((t) => filter === 'all' || t.scenario === filter), [filter]);
  const ids = useMemo(() => ['all', ...Array.from(new Set(facts.txs.map((t) => t.scenario)))], []);
  const check = async (hash: string, signer?: string) => {
    setRes((r) => ({ ...r, [hash]: { state: 'run' } }));
    try {
      // The page talks to the public node directly. No Kedge server is involved in this decoding.
      const { ApiPromise, WsProvider } = await import('@polkadot/api');
      const api = await ApiPromise.create({ provider: new WsProvider(NET.substrateWs), noInitWarn: true });
      const rpc = async (method: string, params: unknown[]) => { const r = await fetch(NET.evmRpc, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) }); const j = await r.json(); if (j.error) throw new Error(j.error.message); return j.result; };
      const out = await resolveOutcome(api, rpc, hash, 30_000);
      let before: string | undefined, after: string | undefined;
      if (signer && out.block > 0) { const { twinOf } = await import('@/lib/kedge/twin'); const { u8aToHex } = await import('@polkadot/util'); const acct = u8aToHex(twinOf(signer));
        const fmt = async (bh: any) => { const a: any = await api.query.system.account.at(bh, acct); return (Number(a.data.free.toBigInt() / 10n ** 10n) / 1e4).toFixed(4); };
        const bh = await api.rpc.chain.getBlockHash(out.block); const ph = await api.rpc.chain.getBlockHash(out.block - 1); before = await fmt(ph); after = await fmt(bh); }
      await api.disconnect(); setRes((r) => ({ ...r, [hash]: { state: 'done', out, before, after } }));
    } catch (e: any) { setRes((r) => ({ ...r, [hash]: { state: 'err', msg: e.message } })); }
  };
  return (<div className="space-y-6">
    <header><p className="micro text-brass-ink">Verify it yourself</p><h1 className="display h1">Proof</h1>
      <p className="mt-2 max-w-2xl">Every transaction below was recorded from a real run on the Portaldot V3 testnet. Press Check and this page reads the block from the public node, finds the extrinsic by its hash, and decodes the events here in your browser.</p></header>
    <Notice>Refused attacks are real failed extrinsics with the decoded error name. Open scenario <strong>A3</strong> to see <span className="mono">recovery.NotYetInheritable</span>.</Notice>
    <div role="group" aria-label="Filter by scenario" className="flex flex-wrap gap-2">{ids.map((i) => <GhostButton key={i} aria-pressed={filter === i} className={filter === i ? '!bg-ink !text-paper' : ''} onClick={() => setFilter(i)}>{i === 'all' ? 'All' : i}</GhostButton>)}</div>
    <ul className="space-y-3">{txs.map((t) => { const r = res[t.hash]; return (<li key={t.hash}><GlowCard className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="micro text-brass-ink">{t.scenario}</p><p className="font-semibold">{t.label}</p><p className="mono text-ink/70">{t.hash}</p></div>
        <div className="flex items-center gap-3"><span className={`micro rounded-full px-3 py-1 ${t.ok ? 'bg-sea-glass/20 text-[#0b6b61]' : 'bg-distress/15 text-distress'}`}>{t.ok ? 'Succeeded' : `Refused: ${t.error}`}</span>
          <PrimaryButton disabled={r?.state === 'run'} onClick={() => check(t.hash, t.signer)}>{r?.state === 'run' ? 'Reading chain...' : 'Check'}</PrimaryButton></div></div>
      {r?.state === 'err' && <p role="alert" className="mt-3 text-sm text-distress">Could not read the chain: {r.msg}</p>}
      {r?.state === 'done' && (<div className="mt-3 text-sm"><p>Block <a className="underline underline-offset-4" href={r.out.explorer} target="_blank" rel="noreferrer">{r.out.block}<span className="sr-only"> (opens in a new tab)</span></a>, extrinsic {r.out.extrinsicIndex}, matched by: {r.out.matchRule}. Receipt status {r.out.receiptStatus}.
        {r.out.errorName ? <> Decoded error: <strong className="mono">{r.out.errorName}</strong>.</> : null}</p>
        {r.before && <p>Signer twin balance: {r.before} tPOT at the parent block, {r.after} tPOT at the block.</p>}
        <ul className="mono mt-2 list-disc pl-5 text-xs">{r.out.events.filter((e: any) => /recovery|utility|revive\.|assets|EthExtrinsicRevert/.test(e.event)).map((e: any, i: number) => <li key={i}>{e.event}{e.error ? ` (${e.error})` : ''}</li>)}</ul></div>)}
    </GlowCard></li>); })}</ul>
  </div>);
}
