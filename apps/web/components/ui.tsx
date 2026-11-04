'use client';
import { useRef, type ReactNode, type ButtonHTMLAttributes } from 'react';
import Link from 'next/link';

export function GlowCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  // CSS-only lift and a cursor-following glow; no animation library, so the page stays light on phones.
  return (
    <div ref={ref}
      onMouseMove={(e) => { const r = ref.current!.getBoundingClientRect(); ref.current!.style.setProperty('--mx', `${e.clientX - r.left}px`); ref.current!.style.setProperty('--my', `${e.clientY - r.top}px`); }}
      className={`relative overflow-hidden rounded-[22px] border border-fog bg-white/70 backdrop-blur-md transition-transform duration-300 hover:-translate-y-1.5 before:pointer-events-none before:absolute before:inset-0 before:opacity-0 before:transition-opacity hover:before:opacity-100 before:[background:radial-gradient(240px_circle_at_var(--mx)_var(--my),rgba(255,90,31,.22),transparent_60%)] ${className}`}>
      {children}
    </div>
  );
}
/** Fade and 16 px rise, staggered by delay. Pure CSS; disabled under prefers-reduced-motion. */
export const Reveal = ({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) => (
  <div className={`rise ${className}`} style={{ animationDelay: `${Math.round(delay * 1000)}ms` }}>{children}</div>
);
const btn = 'inline-flex min-h-[44px] items-center justify-center rounded-xl px-5 py-2.5 font-semibold transition focus-visible:outline-offset-4';
export const PrimaryButton = ({ className = '', ready, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { ready?: boolean }) =>
  <button {...p} className={`${btn} bg-lifejacket text-ink shadow-[0_0_24px_rgba(255,90,31,.45)] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${ready ? 'ready' : ''} ${className}`} />;
export const GhostButton = ({ className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement>) =>
  <button {...p} className={`${btn} border border-ink/30 bg-transparent text-ink hover:bg-ink/5 disabled:opacity-40 ${className}`} />;
export const LinkButton = ({ href, children, primary }: { href: string; children: ReactNode; primary?: boolean }) =>
  <Link href={href} className={`${btn} ${primary ? 'bg-lifejacket text-ink shadow-[0_0_24px_rgba(255,90,31,.45)] hover:brightness-105' : 'border border-ink/30 hover:bg-ink/5'}`}>{children}</Link>;
export const Mono = ({ children }: { children: ReactNode }) => <span className="mono">{children}</span>;
export function StatusRing({ state }: { state: 'protected' | 'not' | 'unknown' }) {
  const c = state === 'protected' ? '#1BB3A2' : state === 'not' ? '#D3263C' : '#B88A2E';
  const t = state === 'protected' ? 'Protected' : state === 'not' ? 'Not protected' : 'Not checked yet';
  return (<div className="flex items-center gap-4" role="status"><svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true"><circle cx="36" cy="36" r="30" fill="none" stroke="#DDD4C2" strokeWidth="8" /><circle cx="36" cy="36" r="30" fill="none" stroke={c} strokeWidth="8" strokeDasharray={state === 'protected' ? '188 0' : state === 'not' ? '40 148' : '90 98'} strokeLinecap="round" transform="rotate(-90 36 36)" /></svg><span className="display h3">{t}</span></div>);
}
export function Receipt({ rows }: { rows: { label: string; status: 'ok' | 'failed' | 'wait'; detail?: string; href?: string }[] }) {
  return (<ul className="divide-y divide-fog rounded-2xl border border-fog bg-white/60">
    {rows.map((r, i) => (<li key={i} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
      <span className="font-medium">{r.label}</span>
      <span className="flex items-center gap-3 text-sm">{r.detail ? <span className="mono text-ink/70">{r.detail}</span> : null}
        <span className={`micro rounded-full px-3 py-1 ${r.status === 'ok' ? 'bg-sea-glass/20 text-[#0b6b61]' : r.status === 'failed' ? 'bg-distress/15 text-distress' : 'bg-brass/20 text-[#7a5a14]'}`}>{r.status === 'ok' ? 'Completed' : r.status === 'failed' ? 'Failed' : 'Waiting'}</span>
        {r.href ? <a className="underline underline-offset-4" href={r.href} target="_blank" rel="noreferrer">Explorer<span className="sr-only"> (opens in a new tab)</span></a> : null}</span></li>))}
  </ul>);
}
export const Notice = ({ tone = 'info', children }: { tone?: 'info' | 'refusal'; children: ReactNode }) =>
  <div role={tone === 'refusal' ? 'alert' : 'note'} className={`rounded-2xl border p-4 ${tone === 'refusal' ? 'border-distress/40 bg-distress/10' : 'border-brass/40 bg-brass/10'}`}>{children}</div>;
