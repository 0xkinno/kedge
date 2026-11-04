'use client';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { isAddress, getAddress } from 'ethers';
import { connect, calls, sendCall, trace, short } from '@/lib/client';
import { PrimaryButton, GlowCard, Notice, Receipt } from '@/components/ui';
import { Flag } from '@/components/art';

const fmt = (planck: string) => (Number(BigInt(planck) / 10n ** 10n) / 1e4).toLocaleString(undefined, { maximumFractionDigits: 4 });
export default function Rescue() {
  const { lost } = useParams<{ lost: string }>(); const [me, setMe] = useState(''); const [v, setV] = useState<any>(null); const [sv, setSv] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const load = useCallback(async () => { if (!isAddress(lost)) return; setV(await (await fetch(`/api/lookout?lost=${lost}`)).json()); }, [lost]);
  useEffect(() => { load(); const t = setInterval(load, 6000); return () => clearInterval(t); }, [load]);
  useEffect(() => { if (me && isAddress(lost)) fetch(`/api/survey?lost=${lost}&dest=${me}`).then((r) => r.json()).then(setSv).catch(() => setErr('Could not survey the old wallet.')); }, [me, lost, v?.inheritor?.account]);
  if (!isAddress(lost)) return <Notice tone="refusal">That is not a wallet address.</Notice>;
  const att = v?.attempts?.[0]; const grp = att ? v.groups[att.groupIndex] : v?.groups?.[0]; const clock = att?.clock; const heir = v?.inheritor;
  const step = heir ? 3 : att ? (clock?.finishable ? 2 : 1) : 0;
  const bring = async () => {
    setBusy(true); setErr(''); const out: any[] = [];
    try {
      if (!heir) { const h = await sendCall(me, calls.finish(lost, att.groupIndex)); const o = await trace(h); out.push({ label: 'Finish the attempt', status: o.extrinsicFailed ? 'failed' : 'ok', detail: o.errorName ?? `block ${o.block}`, href: o.explorer }); setRows([...out]); if (o.extrinsicFailed) throw new Error(o.errorName); }
      const s = await (await fetch(`/api/survey?lost=${lost}&dest=${me}`)).json(); if (!s.callHex) throw new Error('Nothing can move: the survey found no item that would succeed.');
      const h2 = await sendCall(me, s.callHex); const o2 = await trace(h2);
      const items = o2.items as { status: string; error?: string }[]; const labels = s.plan.filter((l: any) => l.willMove).map((l: any) => l.label);
      out.push({ label: 'Bring it home (one signature)', status: o2.extrinsicFailed ? 'failed' : 'ok', detail: `block ${o2.block}`, href: o2.explorer });
      items.forEach((it, i) => out.push({ label: labels[i] ?? `Item ${i + 1}`, status: it.status === 'completed' ? 'ok' : 'failed', detail: it.error }));
      if (o2.controlResult && typeof o2.controlResult === 'object') out.push({ label: 'Receipt says success, but the inner call failed', status: 'failed', detail: JSON.stringify(o2.controlResult) });
      setRows(out); load();
    } catch (e: any) { setErr(e.message); }
    setBusy(false);
  };
  const isHeir = !!me && !!heir && heir.account === (v?.groups?.[0]?.inheritor);
  return (<div className="space-y-8">
    <header><p className="micro text-brass-ink">New phone</p><h1 className="display h1">Rescue</h1><p className="mt-2">Bringing back <span className="mono">{getAddress(lost)}</span></p></header>
    <GlowCard className="p-6"><h2 className="display h3">Timeline</h2>
      <ol className="mt-4 space-y-4" aria-label="Rescue timeline">
        {[['Crew named', !!grp], ['Attempt started and approved', !!att || !!heir], ['Safety delay passed', !!clock?.finishable || !!heir], ['New phone is the inheritor', !!heir], ['Brought home', rows.some((r) => r.label.startsWith('Bring') && r.status === 'ok')]].map(([t, d], i) => (
          <li key={i} className="flex items-center gap-3"><span aria-hidden="true" className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink text-xs ${d ? 'bg-sea-glass' : 'bg-paper-deep'}`}>{d ? 'ok' : i + 1}</span><span className={d ? 'font-semibold' : 'text-ink/70'}>{t as string}</span></li>))}
      </ol>
      {att && grp && (<div className="mt-5"><p className="micro">Approvals</p><div className="mt-2 flex gap-2">{grp.friends.map((_: string, i: number) => <Flag key={i} letter={String.fromCharCode(65 + i)} on={att.approvedIndexes.includes(i)} />)}</div>
        <p className="mt-2 text-sm">{att.approvedIndexes.length} of {grp.friendsNeeded} needed. Started by <span className="mono">{short(att.initiator)}</span> at block {att.initBlock}.</p></div>)}
      {clock && !heir && (<div className="mt-5" aria-live="polite"><p className="micro">Safety delay</p><p className="display text-4xl text-deep-water">{clock.finishable ? 'Passed' : `${clock.blocksLeft} blocks`}</p>{!clock.finishable && <p className="text-sm">About {clock.secondsLeft} seconds. Head block {v.head}, finishable at block {clock.readyAtBlock}.</p>}</div>)}
      {v && !grp && <p className="mt-4">This wallet has no crew. Nothing can be rescued.</p>}</GlowCard>
    <GlowCard className="p-6"><h2 className="display h3">What will move</h2>
      {!me ? <div className="mt-3"><p className="text-sm">Connect your new-phone wallet to survey the old wallet.</p><PrimaryButton className="mt-3" onClick={async () => setMe(getAddress(await connect()))}>Connect new phone</PrimaryButton></div>
        : !sv ? <p className="mt-3 text-sm">Surveying and dry-running each item...</p>
        : <ul className="mt-3 divide-y divide-fog">{sv.plan.map((l: any) => (<li key={l.label} className="flex flex-wrap items-center justify-between gap-2 py-3"><span className="font-medium">{l.label}</span>
          <span className={`micro rounded-full px-3 py-1 ${l.willMove ? 'bg-sea-glass/20 text-[#0b6b61]' : 'bg-distress/15 text-distress'}`}>{l.willMove ? 'Will move' : 'Will not move'}</span>{l.reason && <span className="w-full text-sm text-ink/80">{l.reason}</span>}</li>))}</ul>}
      {sv && <p className="mt-3 text-xs text-ink/70">tPOT shown in planck on chain; the sweep keeps contract items first so deposits are paid before the native sweep.</p>}</GlowCard>
    {step >= 1 && (<div className="flex flex-wrap items-center gap-4"><PrimaryButton ready={step >= 2} disabled={busy || !me || step < 2 || !sv?.plan?.some((l: any) => l.willMove)} onClick={bring}>Bring it home</PrimaryButton>
      <p className="text-sm text-ink/80">{step < 2 ? 'Unlocks when the safety delay has passed.' : 'One signature from your new phone.'}</p></div>)}
    {err && <Notice tone="refusal">{err}</Notice>}
    {rows.length > 0 && (<section aria-labelledby="receipt"><h2 id="receipt" className="display h2">Receipt</h2><div className="mt-3"><Receipt rows={rows} /></div>
      <p className="mt-2 text-sm text-ink/80">A receipt can say success while one item failed. Each item above is read from the chain events, not from the receipt.</p></section>)}
  </div>);
}
