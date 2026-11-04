'use client';
import { useEffect, useState } from 'react';

type S = { block?: number; spec?: string; vault?: boolean; ms?: number; ok: boolean; at?: string };
/** Real probes from /api/status every 12 s. If a probe fails, it says so. Nothing here is a constant. */
export default function ChainPulse() {
  const [s, setS] = useState<S | null>(null);
  useEffect(() => {
    let live = true;
    const tick = async () => { try { const j = await (await fetch('/api/status', { cache: 'no-store' })).json(); const c = (n: string) => j.checks.find((x: any) => x.name === n);
      if (live) setS({ ok: j.writesAllowed, block: c('substrate head')?.block, spec: c('runtime version')?.specVersion, vault: c('vault code')?.present, ms: c('substrate head')?.ms, at: j.at }); } catch { if (live) setS({ ok: false }); } };
    tick(); const t = setInterval(tick, 12000); return () => { live = false; clearInterval(t); };
  }, []);
  return (
    <div role="status" aria-live="polite" className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-fog bg-white/60 px-4 py-3 text-sm backdrop-blur">
      <span className="flex items-center gap-2 font-semibold"><span className={`live-dot ${s?.ok === false ? '!bg-distress' : ''}`} aria-hidden="true" />{s == null ? 'Reading the chain...' : s.ok ? 'Chain live' : 'A chain probe failed'}</span>
      {s?.block != null && <span>Block <span className="numeral text-base">{s.block.toLocaleString('en-US')}</span></span>}
      {s?.spec != null && <span>Runtime <span className="mono">portaldot-v3 / {s.spec}</span></span>}
      {s?.vault != null && <span>Vault {s.vault ? 'deployed' : 'missing'}</span>}
      {s?.ms != null && <span className="text-ink/70">{s.ms} ms</span>}
    </div>
  );
}
