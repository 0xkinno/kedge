'use client';
import { useRef, useState } from 'react';
import { PrimaryButton, GlowCard, Notice, Receipt } from '@/components/ui';

type Step = { n: number; label: string; status: 'run' | 'ok' | 'fail'; explorer?: string; phrase?: string; blocksLeft?: number; secondsLeft?: number; moved?: string };
export default function Drill() {
  const [steps, setSteps] = useState<Record<number, Step>>({}); const [state, setState] = useState<'idle' | 'run' | 'done' | 'err'>('idle'); const [err, setErr] = useState(''); const [banner, setBanner] = useState<any>(null); const es = useRef<EventSource | null>(null);
  const start = () => {
    setSteps({}); setErr(''); setState('run'); setBanner(null);
    const s = new EventSource('/api/drill'); es.current = s;
    s.onmessage = (m) => { const d = JSON.parse(m.data); if (d.banner) setBanner(d); else if (d.done) { setState('done'); s.close(); } else if (d.error) { setErr(d.error); setState('err'); s.close(); } else setSteps((p) => ({ ...p, [d.n]: d })); };
    s.onerror = async () => { s.close(); if (state !== 'done') { try { const r = await fetch('/api/drill'); if (!r.ok) setErr((await r.json()).error); else setErr('The connection dropped.'); } catch { setErr('The connection dropped.'); } setState('err'); } };
  };
  const list = Object.values(steps).sort((a, b) => a.n - b.n); const pct = Math.round((list.filter((x) => x.status === 'ok').length / 8) * 100);
  return (<div className="space-y-6">
    <header><p className="micro text-brass-ink">Muster Drill</p><h1 className="display h1">Run a rescue in about two minutes</h1>
      <p className="mt-2 max-w-2xl">A full rescue on the live testnet: name the crew, approve, wait out the delay, bring it home. Every step links to the block explorer.</p></header>
    <Notice><strong>House crew keys sign this drill.</strong> For your own wallet, use <a className="underline underline-offset-4" href="/harbour">Harbour</a>. Drills are capped: one at a time, 3 per hour per visitor, 20 per day, with a kill switch.</Notice>
    <PrimaryButton onClick={start} disabled={state === 'run'}>{state === 'run' ? 'Drill running...' : state === 'done' ? 'Run another drill' : 'Start the drill'}</PrimaryButton>
    {state !== 'idle' && (<div role="progressbar" aria-label="Drill progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-3 w-full overflow-hidden rounded-full bg-fog"><div className="h-full bg-sea-glass transition-all" style={{ width: `${pct}%` }} /></div>)}
    {banner && <p className="text-sm">Throwaway wallet <span className="mono">{banner.lost}</span>. Crew: Lorna <span className="mono">{banner.crew.lorna.slice(0, 8)}</span>, Ben <span className="mono">{banner.crew.ben.slice(0, 8)}</span> (house crew).</p>}
    {err && <Notice tone="refusal"><strong>The drill stopped.</strong> {err}</Notice>}
    {list.length > 0 && <GlowCard className="p-4"><Receipt rows={list.map((s) => ({ label: s.label, status: s.status === 'ok' ? 'ok' : s.status === 'fail' ? 'failed' : 'wait', detail: s.phrase && s.status === 'run' ? `phrase: ${s.phrase}` : s.blocksLeft !== undefined && s.status === 'run' ? `${s.blocksLeft} blocks, about ${s.secondsLeft} s` : s.moved, href: s.explorer }))} /></GlowCard>}
    {state === 'done' && <Notice>Done. Open <a className="underline underline-offset-4" href="/proof">Proof</a> to see how the recorded runs are verified.</Notice>}
  </div>);
}
