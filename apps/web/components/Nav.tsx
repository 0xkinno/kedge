'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { KedgeMark } from './art';

const links = [['Harbour', '/harbour'], ['Crew', '/crew'], ['Rescue', '/rescue'], ['Proof', '/proof'], ['Drill', '/drill']] as const;
export default function Nav() {
  const path = usePathname(); const [small, setSmall] = useState(false);
  useEffect(() => { const f = () => setSmall(window.scrollY > 40); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);
  return (<>
    <header className="fixed left-1/2 top-3 z-50 w-[min(1120px,calc(100%-24px))] -translate-x-1/2">
      <nav aria-label="Main" className={`flex items-center justify-between gap-2 rounded-[14px] border border-brass/60 bg-deep-water/95 px-3 text-paper backdrop-blur transition-all ${small ? 'h-12' : 'h-14'}`}>
        <Link href="/" className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 font-display font-extrabold tracking-[0.02em]" aria-label="Kedge home"><KedgeMark width={28} height={28} /><span className={small ? 'hidden' : 'hidden sm:inline'}>KEDGE</span></Link>
        <ul className="hidden items-center gap-1 md:flex">{links.map(([t, h]) => (<li key={h}><Link href={h} aria-current={path.startsWith(h) ? 'page' : undefined} className={`rounded-lg px-3 py-2 text-sm font-medium hover:bg-white/10 ${path.startsWith(h) ? 'bg-white/15' : ''}`}>{t}</Link></li>))}</ul>
        <div className="flex items-center gap-2">
          <Link href="/judge?tour=1" className="hidden rounded-lg px-3 py-2 text-sm hover:bg-white/10 sm:inline">Guided tour</Link>
          <Link href="/harbour" className="rounded-lg bg-lifejacket px-3 py-2 text-sm font-semibold text-ink hover:shadow-[0_0_24px_rgba(255,90,31,.45)]">Connect wallet</Link>
        </div>
      </nav>
    </header>
    <nav aria-label="Mobile" className="fixed bottom-3 left-1/2 z-50 w-[min(420px,calc(100%-24px))] -translate-x-1/2 rounded-[14px] border border-brass/60 bg-deep-water/95 text-paper backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">{links.map(([t, h]) => (<li key={h}><Link href={h} aria-current={path.startsWith(h) ? 'page' : undefined} className={`flex min-h-[48px] items-center justify-center text-xs font-medium ${path.startsWith(h) ? 'text-lifejacket' : ''}`}>{t}</Link></li>))}</ul>
    </nav></>);
}
