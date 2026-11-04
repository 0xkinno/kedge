'use client';
import { useEffect, useState } from 'react';
import { isAddress, getAddress } from 'ethers';
import { connect, calls, sendCall, trace, rpc, short, eth } from '@/lib/client';
import { checkGroups, refuseContractInheritor, KedgeRefusal } from '@/lib/kedge/mate';
import { twinOf } from '@/lib/kedge/twin';
import { makeLifeboat, lifeboatPdf } from '@/lib/lifeboat';
import { PrimaryButton, GhostButton, StatusRing, Notice, GlowCard, Receipt } from '@/components/ui';
import facts from '@/data/FACTS.json';

const PRESETS = { drill: { delay: 10, cancel: 2, label: 'Drill: 10 blocks (about a minute)' }, real: { delay: 43200, cancel: 7200, label: 'Real: 72 hours (43,200 blocks)' } } as const;
export default function Harbour() {
  const [me, setMe] = useState(''); const [g, setG] = useState(['', '', '']); const [need, setNeed] = useState(2); const [preset, setPreset] = useState<keyof typeof PRESETS>('drill');
  const [pass, setPass] = useState(''); const [boat, setBoat] = useState<{ address: string; keystore: string } | null>(null);
  const [heir, setHeir] = useState(''); const [msg, setMsg] = useState<{ tone: 'info' | 'refusal'; text: string } | null>(null);
  const [state, setState] = useState<'protected' | 'not' | 'unknown'>('unknown'); const [view, setView] = useState<any>(null); const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<any[]>([]); const [chat, setChat] = useState(''); const [act, setAct] = useState('');
  useEffect(() => { setAct(new URLSearchParams(location.search).get('act') ?? ''); }, []);
  const refresh = async (a: string) => { try { const v = await (await fetch(`/api/lookout?lost=${a}`)).json(); setView(v); setState(v.groups?.length ? 'protected' : 'not'); } catch { setState('unknown'); } };
  const doConnect = async () => { try { const a = await connect(); setMe(getAddress(a)); refresh(a); } catch (e: any) { setMsg({ tone: 'refusal', text: e.message }); } };
  const makeBoat = async () => { setBusy(true); try { const b = await makeLifeboat(pass); setBoat(b); setHeir(b.address); setMsg({ tone: 'info', text: 'New wallet made in your browser. Download the card now: the key is not stored anywhere else.' }); } catch (e: any) { setMsg({ tone: 'refusal', text: e.message }); } setBusy(false); };
  const card = async () => { const blob = await lifeboatPdf(me || 'not connected', boat!.address, boat!.keystore); const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = 'kedge-lifeboat-card.pdf'; a.click(); URL.revokeObjectURL(u); };
  const protect = async () => {
    setMsg(null); setBusy(true);
    try {
      const list = g.map((x) => x.trim()).filter(Boolean); if (!list.every(isAddress)) throw new KedgeRefusal('BAD_ADDRESS', 'Every guardian must be a valid wallet address.');
      if (!isAddress(heir)) throw new KedgeRefusal('BAD_HEIR', 'Add the new-phone address (make a Lifeboat key above, or paste one).');
      const p = PRESETS[preset]; const lost32 = twinOf(me);
      const spec = { friends: list.map(twinOf), friendsNeeded: need, inheritor32: twinOf(heir), inheritanceDelay: p.delay, priority: 1, cancelDelay: p.cancel };
      checkGroups(lost32, [spec]); await refuseContractInheritor(twinOf(heir), (a) => rpc('eth_getCode', [a, 'latest']));
      const hash = await sendCall(me, calls.setGroups([{ friends: list, need, heir, delay: p.delay, priority: 1, cancel: p.cancel }]));
      setRows([{ label: 'Crew named (set_friend_groups)', status: 'wait', detail: short(hash) }]);
      const o = await trace(hash);
      setRows([{ label: 'Crew named (set_friend_groups)', status: o.extrinsicFailed ? 'failed' : 'ok', detail: o.errorName ?? `block ${o.block}`, href: o.explorer }]);
      refresh(me);
    } catch (e: any) { setMsg({ tone: 'refusal', text: e instanceof KedgeRefusal ? e.message : `The chain or wallet stopped this: ${e.message}` }); }
    setBusy(false);
  };
  const run = async (kind: 'cancel' | 'slash', gi: number) => { setBusy(true); try { const hash = await sendCall(me, kind === 'cancel' ? calls.cancel(me, gi) : calls.slash(gi)); const o = await trace(hash); setRows([{ label: kind === 'cancel' ? 'Attempt stopped' : 'Attempt slashed', status: o.extrinsicFailed ? 'failed' : 'ok', detail: o.errorName ?? `block ${o.block}`, href: o.explorer }]); refresh(me); } catch (e: any) { setMsg({ tone: 'refusal', text: e.message }); } setBusy(false); };
  const watch = async () => { try { const nonce = Math.random().toString(36).slice(2, 10); const text = `kedge/watch/v1:${me.toLowerCase()}:${chat}:${nonce}`;
    const signature = await eth().request({ method: 'personal_sign', params: [text, me] }); const r = await fetch('/api/watch', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ address: me, chatId: chat, nonce, signature }) }); const j = await r.json();
    setMsg({ tone: r.ok ? 'info' : 'refusal', text: r.ok ? 'Alerts on. You will get one message per attempt on your wallet.' : j.error }); } catch (e: any) { setMsg({ tone: 'refusal', text: e.message }); } };
  const attempts = view?.attempts ?? [];
  return (<div className="space-y-8">
    <header><p className="micro text-brass">Owner</p><h1 className="display h1">Harbour</h1><p className="mt-2 max-w-2xl">Name your crew once, print the card, keep your phone. Your own wallet signs everything.</p></header>
    <GlowCard className="p-6"><div className="flex flex-wrap items-center justify-between gap-4"><StatusRing state={state} />
      {me ? <p className="mono" aria-label="Connected wallet">{me}</p> : <PrimaryButton onClick={doConnect}>Connect wallet</PrimaryButton>}</div></GlowCard>
    {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
    {act && attempts.length > 0 && (<Notice tone="refusal"><h2 className="display h3">An attempt is open on your wallet</h2><p className="mt-1 text-sm">If this was not your crew, stop it. Started by <span className="mono">{short(attempts[0].initiator)}</span> in group {attempts[0].groupIndex}.</p>
      <div className="mt-3 flex flex-wrap gap-3"><PrimaryButton disabled={busy || !me} onClick={() => run('cancel', attempts[0].groupIndex)}>Stop this attempt</PrimaryButton><GhostButton disabled={busy || !me} onClick={() => run('slash', attempts[0].groupIndex)}>Slash the starter</GhostButton></div></Notice>)}
    <section aria-labelledby="boat" className="space-y-3"><h2 id="boat" className="display h2">1. Lifeboat key and card</h2>
      <p className="max-w-2xl text-sm">This is the wallet you will use on your new phone. It is made here, locked with a passphrase you choose, and never leaves this page.</p>
      <label className="block"><span className="micro">Passphrase (8 or more characters)</span><input type="password" value={pass} onChange={(e) => setPass(e.target.value)} className="mt-1 block min-h-[44px] w-full max-w-md rounded-xl border border-ink/30 bg-white/80 px-3" autoComplete="new-password" /></label>
      <div className="flex flex-wrap gap-3"><GhostButton onClick={makeBoat} disabled={busy || pass.length < 8}>Make my Lifeboat key</GhostButton>{boat && <PrimaryButton onClick={card}>Download Lifeboat Card (PDF)</PrimaryButton>}</div>
      {boat && <p className="text-sm">New wallet: <span className="mono">{boat.address}</span></p>}</section>
    <section aria-labelledby="crew" className="space-y-3"><h2 id="crew" className="display h2">2. Your crew</h2>
      {g.map((v, i) => (<label key={i} className="block"><span className="micro">Guardian {i + 1} wallet address</span><input value={v} onChange={(e) => setG(g.map((x, j) => (j === i ? e.target.value : x)))} placeholder="0x..." className="mono mt-1 block min-h-[44px] w-full max-w-xl rounded-xl border border-ink/30 bg-white/80 px-3" /></label>))}
      <div className="flex flex-wrap gap-6"><label><span className="micro block">Approvals needed</span><select value={need} onChange={(e) => setNeed(+e.target.value)} className="mt-1 min-h-[44px] rounded-xl border border-ink/30 bg-white/80 px-3">{[1, 2, 3].map((n) => <option key={n}>{n}</option>)}</select></label>
        <label><span className="micro block">Safety delay</span><select value={preset} onChange={(e) => setPreset(e.target.value as any)} className="mt-1 min-h-[44px] rounded-xl border border-ink/30 bg-white/80 px-3">{Object.entries(PRESETS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label></div>
      <label className="block"><span className="micro">New-phone wallet (inheritor)</span><input value={heir} onChange={(e) => setHeir(e.target.value)} placeholder="0x..." className="mono mt-1 block min-h-[44px] w-full max-w-xl rounded-xl border border-ink/30 bg-white/80 px-3" /></label>
      <PrimaryButton onClick={protect} disabled={busy || !me}>{me ? 'Protect my wallet' : 'Connect a wallet first'}</PrimaryButton></section>
    {rows.length > 0 && <Receipt rows={rows} />}
    <section aria-labelledby="cost"><h2 id="cost" className="display h2">What it costs</h2>
      <dl className="mt-3 grid max-w-xl grid-cols-2 gap-2 text-sm"><dt>Naming the crew</dt><dd>{facts.measured.costPerProtectionTPOT} tPOT fee</dd><dt>Deposits held</dt><dd>0 tPOT (measured: none on this testnet)</dd><dt>Refundable</dt><dd>Not applicable</dd><dt>A rescue</dt><dd>{facts.measured.costPerRescueTPOT} tPOT in fees</dd></dl></section>
    <section aria-labelledby="watch" className="space-y-3"><h2 id="watch" className="display h2">3. Alerts (optional)</h2><p className="max-w-2xl text-sm">Get one message when someone starts an attempt on your wallet. You sign a short message in your wallet to prove it is yours.</p>
      <label className="block"><span className="micro">Telegram chat id</span><input value={chat} onChange={(e) => setChat(e.target.value)} inputMode="numeric" className="mono mt-1 block min-h-[44px] w-full max-w-xs rounded-xl border border-ink/30 bg-white/80 px-3" /></label>
      <GhostButton onClick={watch} disabled={!me || !/^-?\d{3,20}$/.test(chat)}>Turn on alerts</GhostButton></section>
  </div>);
}
