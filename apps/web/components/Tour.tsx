'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const STEPS = [
  { path: '/', sel: '[data-tour="hero"]', title: 'The sentence', text: 'Lose the phone, not the wages. A crew brings a wallet back with Portaldot\'s Recovery pallet, signed from MetaMask.' },
  { path: '/harbour', sel: 'h1', title: 'Harbour: protection status', text: 'Ramon names his crew once, makes a Lifeboat key, and prints the card. His own wallet signs.' },
  { path: '/crew', sel: 'h1', title: 'Guardian door: the call phrase', text: 'Guardians hear four words on a call and type them. Approve stays locked until they match.' },
  { path: '/rescue', sel: 'h1', title: 'Rescue: the delay clock', text: 'The timeline shows who approved and counts the safety delay in blocks.' },
  { path: '/drill', sel: 'h1', title: 'Bring it home and the receipt', text: 'One signature moves tPOT, kUSD and vault savings. Each item has its own status.' },
  { path: '/proof', sel: 'h1', title: 'A refused attack', text: 'Scenario A3 is a real failed extrinsic: NotYetInheritable. Press Check to decode it here.' },
  { path: '/', sel: '[data-tour="hero"]', title: 'The counterfactual', text: 'Without Kedge, scenario C1 shows funds at an address nobody can sign for. That is the value.' },
];
export default function Tour() {
  const q = useSearchParams(); const router = useRouter(); const render = q.get('render') === '1'; const on = q.get('tour') === '1';
  const [i, setI] = useState(0); const [box, setBox] = useState<DOMRect | null>(null);
  useEffect(() => { if (!on) return; const s = STEPS[i]; if (location.pathname !== s.path) router.push(`${s.path}?tour=1${render ? '&render=1' : ''}`); }, [i, on, render, router]);
  useEffect(() => { if (!on) return; const t = setTimeout(() => { const el = document.querySelector(STEPS[i].sel); setBox(el ? el.getBoundingClientRect() : null); }, 600); return () => clearTimeout(t); }, [i, on]);
  useEffect(() => { if (!on || !render) return; const t = setTimeout(() => setI((n) => Math.min(STEPS.length - 1, n + 1)), 6000); return () => clearTimeout(t); }, [i, on, render]);
  useEffect(() => { if (!on) return; const k = (e: KeyboardEvent) => { if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); setI((n) => Math.min(STEPS.length - 1, n + 1)); } if (e.key === 'ArrowLeft') setI((n) => Math.max(0, n - 1)); if (e.key === 'Escape') router.push('/judge'); }; window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k); }, [on, router]);
  if (!on) return null; const s = STEPS[i];
  return (<div role="dialog" aria-label="Guided tour" aria-live="polite">
    {box && <div aria-hidden="true" className="pointer-events-none fixed z-40 rounded-2xl" style={{ left: box.left - 8, top: box.top - 8, width: box.width + 16, height: box.height + 16, boxShadow: '0 0 0 9999px rgba(12,37,54,.55)' }} />}
    <div className="fixed bottom-20 left-1/2 z-50 w-[min(520px,calc(100%-24px))] -translate-x-1/2 rounded-2xl border border-brass bg-paper p-4 shadow-xl md:bottom-6">
      <p className="micro text-brass-ink">Step {i + 1} of {STEPS.length}</p><p className="display h3">{s.title}</p><p className="text-sm">{s.text}</p>
      <div className="mt-3 flex items-center justify-between gap-2"><div className="flex gap-1" aria-hidden="true">{STEPS.map((_, n) => <span key={n} className={`h-1.5 w-6 rounded-full ${n <= i ? 'bg-lifejacket' : 'bg-fog'}`} />)}</div>
        <div className="flex gap-2"><button className="min-h-[44px] rounded-lg border border-ink/30 px-3 text-sm" onClick={() => setI(Math.max(0, i - 1))}>Back</button><button className="min-h-[44px] rounded-lg bg-lifejacket px-3 text-sm font-semibold text-ink" onClick={() => (i === STEPS.length - 1 ? router.push('/judge') : setI(i + 1))}>{i === STEPS.length - 1 ? 'Finish' : 'Next'}</button></div></div>
      <p className="mt-2 text-xs text-ink/70">Keys: Space or Right for next, Left for back, Esc to exit.</p></div></div>);
}
