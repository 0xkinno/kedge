'use client';
import { useEffect, useState } from 'react';
import { isAddress, getAddress } from 'ethers';
import { connect, calls, sendCall, trace, rpc, short, eth } from '@/lib/client';
import { checkGroups, refuseContractInheritor, KedgeRefusal } from '@/lib/kedge/mate';
import { twinOf } from '@/lib/kedge/twin';
import { makeLifeboat, lifeboatPdf } from '@/lib/lifeboat';
import { PrimaryButton, GhostButton, StatusRing, Notice, GlowCard, Receipt } from '@/components/ui';
import facts from '@/data/FACTS.json';
import { cleanDoor, type Door } from '@/lib/deeplink';

const PRESETS = { drill: { delay: 10, cancel: 2, label: 'Drill: 10 blocks (about a minute)' }, real: { delay: 43200, cancel: 7200, label: 'Real: 72 hours (43,200 blocks)' } } as const;
const Step = ({ n, id, title, children }: { n: number; id: string; title: string; children: React.ReactNode }) => (
    <section aria-labelledby={id} className="rounded-[22px] border border-fog bg-white/70 p-5 backdrop-blur md:p-7"><div className="flex items-center gap-3"><span aria-hidden="true" className="numeral flex h-9 w-9 items-center justify-center rounded-full bg-deep-water text-paper">{n}</span><h2 id={id} className="display h3">{title}</h2></div><div className="mt-4 space-y-3">{children}</div></section>);

export default function Harbour() {
  const [me, setMe] = useState(''); const [g, setG] = useState(['', '', '']); const [need, setNeed] = useState(2); const [preset, setPreset] = useState<keyof typeof PRESETS>('drill');
  const [pass, setPass] = useState(''); const [boat, setBoat] = useState<{ address: string; keystore: string } | null>(null);
  const [heir, setHeir] = useState(''); const [msg, setMsg] = useState<{ tone: 'info' | 'refusal'; text: string } | null>(null);
  const [state, setState] = useState<'protected' | 'not' | 'unknown'>('unknown'); const [view, setView] = useState<any>(null); const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<any[]>([]); const [chat, setChat] = useState(''); const [act, setAct] = useState('');
  const [fam, setFam] = useState(false); const [famG, setFamG] = useState(['', '']); const [famHeir, setFamHeir] = useState(''); const [crewIdx, setCrewIdx] = useState(0);
  const [door, setDoor] = useState<Door>({ guardians: [] }); const [done, setDone] = useState(false); const [left, setLeft] = useState(5);
  useEffect(() => {
    const sp = new URLSearchParams(location.search); setAct(sp.get('act') ?? '');
    const d = cleanDoor(sp); setDoor(d); if (d.guardians.length) setG([...d.guardians, '', '', ''].slice(0, 3)); if (d.need) setNeed(d.need);
  }, []);
  useEffect(() => { if (!done || !door.ret) return; if (left <= 0) { location.href = door.ret; return; } const t = setTimeout(() => setLeft((n) => n - 1), 1000); return () => clearTimeout(t); }, [done, left, door.ret]);
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
      const famList = famG.map((x) => x.trim()).filter(Boolean); const famDelay = preset === 'real' ? 432000 : 20; // 30 days, or 20 blocks in a drill
      if (fam) { if (famList.length < 2 || !famList.every(isAddress)) throw new KedgeRefusal('BAD_FAMILY', 'The Family group needs two valid guardian addresses.'); if (!isAddress(famHeir)) throw new KedgeRefusal('BAD_FAMILY_HEIR', 'Add the wallet that should inherit if you do not come home.'); }
      const famSpec = { friends: famList.map(twinOf), friendsNeeded: 2, inheritor32: fam && isAddress(famHeir) ? twinOf(famHeir) : twinOf(heir), inheritanceDelay: famDelay, priority: 0, cancelDelay: p.cancel };
      checkGroups(lost32, fam ? [famSpec, spec] : [spec]); await refuseContractInheritor(twinOf(heir), (a) => rpc('eth_getCode', [a, 'latest'])); if (fam) await refuseContractInheritor(twinOf(famHeir), (a) => rpc('eth_getCode', [a, 'latest']));
      // Family (priority 0, the strongest) is group 0; Crew is group 1. A8 and A9 on the Proof page show Family outranking Crew.
      const groups = fam ? [{ friends: famList, need: 2, heir: famHeir, delay: famDelay, priority: 0, cancel: p.cancel }, { friends: list, need, heir, delay: p.delay, priority: 1, cancel: p.cancel }] : [{ friends: list, need, heir, delay: p.delay, priority: 1, cancel: p.cancel }];
      setCrewIdx(fam ? 1 : 0);
      const hash = await sendCall(me, calls.setGroups(groups));
      setRows([{ label: 'Crew named (set_friend_groups)', status: 'wait', detail: short(hash) }]);
      const o = await trace(hash);
      setRows([{ label: 'Crew named (set_friend_groups)', status: o.extrinsicFailed ? 'failed' : 'ok', detail: o.errorName ?? `block ${o.block}`, href: o.explorer }]);
      if (!o.extrinsicFailed) setDone(true);
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
    <header><p className="micro text-brass-ink">Owner</p><h1 className="display h1">Harbour</h1><p className="mt-2 max-w-2xl">Name your crew once, print the card, keep your phone. Your own wallet signs everything.</p></header>
    {door.app && !done && <Notice><p><strong>{door.app}</strong> asked you to protect your wallet with Kedge. You sign with your own wallet. {door.ret ? 'You will be sent back when you are done.' : ''}</p></Notice>}
    {done && door.ret && <Notice><p role="status" aria-live="polite">Protected. Returning to <strong>{door.app ?? new URL(door.ret).hostname}</strong> in {left} s. <a className="underline underline-offset-4" href={door.ret}>Return now</a></p></Notice>}
    {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
    {act && attempts.length > 0 && (<Notice tone="refusal"><h2 className="display h3">An attempt is open on your wallet</h2><p className="mt-1 text-sm">If this was not your crew, stop it. Started by <span className="mono">{short(attempts[0].initiator)}</span> in group {attempts[0].groupIndex}.</p>
      <div className="mt-3 flex flex-wrap gap-3"><PrimaryButton disabled={busy || !me} onClick={() => run('cancel', attempts[0].groupIndex)}>Stop this attempt</PrimaryButton><GhostButton disabled={busy || !me} onClick={() => run('slash', attempts[0].groupIndex)}>Slash the starter</GhostButton></div></Notice>)}
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Step n={1} id="boat" title="Lifeboat key and card">
          <p className="max-w-xl text-sm">The wallet you will use on your new phone. It is made here, locked with a passphrase you choose, and never leaves this page.</p>
          <label className="block"><span className="micro">Passphrase (8 or more characters)</span><input type="password" value={pass} onChange={(e) => setPass(e.target.value)} className="mt-1 block min-h-[44px] w-full rounded-xl border border-ink/25 bg-white/85 px-3 shadow-[inset_0_1px_2px_rgba(12,37,54,.06)] focus:border-lifejacket max-w-md" autoComplete="new-password" /></label>
          <div className="flex flex-wrap gap-3"><GhostButton onClick={makeBoat} disabled={busy || pass.length < 8}>Make my Lifeboat key</GhostButton>{boat && <PrimaryButton onClick={card}>Download Lifeboat Card (PDF)</PrimaryButton>}</div>
          {boat && <p className="text-sm">New wallet: <span className="mono">{boat.address}</span></p>}</Step>
        <Step n={2} id="crew" title="Your crew">
          {g.map((v, i) => (<label key={i} className="block"><span className="micro">Guardian {i + 1} wallet address</span><input value={v} onChange={(e) => setG(g.map((x, j) => (j === i ? e.target.value : x)))} placeholder="0x..." className="mt-1 block min-h-[44px] w-full rounded-xl border border-ink/25 bg-white/85 px-3 shadow-[inset_0_1px_2px_rgba(12,37,54,.06)] focus:border-lifejacket mono" /></label>))}
          <div className="grid gap-4 sm:grid-cols-2"><label><span className="micro block">Approvals needed</span><select value={need} onChange={(e) => setNeed(+e.target.value)} className="mt-1 block min-h-[44px] w-full rounded-xl border border-ink/25 bg-white/85 px-3 shadow-[inset_0_1px_2px_rgba(12,37,54,.06)] focus:border-lifejacket">{[1, 2, 3].map((n) => <option key={n}>{n}</option>)}</select></label>
            <label><span className="micro block">Safety delay</span><select value={preset} onChange={(e) => setPreset(e.target.value as any)} className="mt-1 block min-h-[44px] w-full rounded-xl border border-ink/25 bg-white/85 px-3 shadow-[inset_0_1px_2px_rgba(12,37,54,.06)] focus:border-lifejacket">{Object.entries(PRESETS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></label></div>
          <label className="block"><span className="micro">New-phone wallet (inheritor)</span><input value={heir} onChange={(e) => setHeir(e.target.value)} placeholder="0x..." className="mt-1 block min-h-[44px] w-full rounded-xl border border-ink/25 bg-white/85 px-3 shadow-[inset_0_1px_2px_rgba(12,37,54,.06)] focus:border-lifejacket mono" /></label>
          <label className="flex items-start gap-3 rounded-xl border border-fog bg-paper/60 p-3"><input type="checkbox" checked={fam} onChange={(e) => setFam(e.target.checked)} className="mt-1 h-5 w-5 accent-[#FF5A1F]" />
            <span><span className="font-semibold">If I do not come home</span><span className="mt-0.5 block text-sm text-ink/80">Add a Family group. It outranks Crew: if your family finishes a recovery, it replaces whoever the crew chose. It uses a long delay (30 days; 20 blocks in a drill).</span></span></label>
          {fam && (<div className="space-y-3 rounded-xl border border-brass/40 bg-white/60 p-3">
            {famG.map((v, i) => (<label key={i} className="block"><span className="micro">Family guardian {i + 1} wallet address</span><input value={v} onChange={(e) => setFamG(famG.map((x, j) => (j === i ? e.target.value : x)))} placeholder="0x..." className="mt-1 block min-h-[44px] w-full rounded-xl border border-ink/25 bg-white/85 px-3 shadow-[inset_0_1px_2px_rgba(12,37,54,.06)] focus:border-lifejacket max-w-md mono" /></label>))}
            <label className="block"><span className="micro">Family heir wallet</span><input value={famHeir} onChange={(e) => setFamHeir(e.target.value)} placeholder="0x..." className="mt-1 block min-h-[44px] w-full rounded-xl border border-ink/25 bg-white/85 px-3 shadow-[inset_0_1px_2px_rgba(12,37,54,.06)] focus:border-lifejacket max-w-md mono" /></label></div>)}
          <PrimaryButton onClick={protect} disabled={busy || !me}>{me ? 'Protect my wallet' : 'Connect a wallet first'}</PrimaryButton>
          {done && me && (<div className="rounded-xl border border-sea-glass/50 bg-sea-glass/10 p-3 text-sm"><p className="font-semibold">Share these links</p>
            <p className="mt-1">Crew guardians: <a className="mono underline underline-offset-4" href={`/crew/${me}?group=${crewIdx}`}>/crew/{short(me)}?group={crewIdx}</a></p>
            {fam && <p className="mt-1">Family guardians: <a className="mono underline underline-offset-4" href={`/crew/${me}?group=0`}>/crew/{short(me)}?group=0</a></p>}</div>)}
          {rows.length > 0 && <Receipt rows={rows} />}</Step>
        <Step n={3} id="watch" title="Alerts (optional)">
          <p className="max-w-xl text-sm">One message when someone starts an attempt on your wallet. You sign a short message in your wallet to prove it is yours.</p>
          <label className="block"><span className="micro">Telegram chat id</span><input value={chat} onChange={(e) => setChat(e.target.value)} inputMode="numeric" className="mt-1 block min-h-[44px] w-full rounded-xl border border-ink/25 bg-white/85 px-3 shadow-[inset_0_1px_2px_rgba(12,37,54,.06)] focus:border-lifejacket mono max-w-xs" /></label>
          <GhostButton onClick={watch} disabled={!me || !/^-?\d{3,20}$/.test(chat)}>Turn on alerts</GhostButton></Step>
      </div>
      <aside aria-label="Your protection" className="space-y-5 lg:sticky lg:top-24">
        <GlowCard className="p-5"><p className="micro text-brass-ink">Your protection</p><div className="mt-3"><StatusRing state={state} /></div>
          <div className="mt-4">{me ? <p className="mono text-[13px]" aria-label="Connected wallet">{me}</p> : <PrimaryButton onClick={doConnect}>Connect wallet</PrimaryButton>}</div>
          {view?.groups?.length ? <p className="mt-3 text-sm">{view.groups.length} group on chain. {view.inheritor ? 'An inheritor is set.' : 'No inheritor yet.'}</p> : null}</GlowCard>
        <GlowCard className="p-5"><p className="micro text-brass-ink">What it costs</p>
          <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-sm"><dt>Naming the crew</dt><dd className="numeral text-base">{facts.measured.costPerProtectionTPOT.toFixed(4)} tPOT</dd><dt>Deposits held</dt><dd className="numeral text-base">0 tPOT</dd><dt>A rescue, in fees</dt><dd className="numeral text-base">{facts.measured.costPerRescueTPOT.toFixed(4)} tPOT</dd></dl>
          <p className="mt-3 text-xs text-ink/70">Measured on this testnet: no deposit is held, so nothing is refundable or lost.</p></GlowCard>
      </aside>
    </div>
  </div>);
}
