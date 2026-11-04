'use client';
import { useEffect } from 'react';
/** Lenis smooth scroll, loaded after idle on larger screens only, and never under reduced motion. */
export default function Smooth() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || window.innerWidth < 900) return;
    let raf = 0; let lenis: any; let stop = false;
    const start = async () => { const { default: Lenis } = await import('lenis'); if (stop) return; lenis = new Lenis({ lerp: 0.12 }); const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); }; raf = requestAnimationFrame(loop); };
    const id = ('requestIdleCallback' in window) ? (window as any).requestIdleCallback(start) : setTimeout(start, 1500);
    return () => { stop = true; cancelAnimationFrame(raf); lenis?.destroy(); if ('cancelIdleCallback' in window) (window as any).cancelIdleCallback(id); else clearTimeout(id); };
  }, []);
  return null;
}
