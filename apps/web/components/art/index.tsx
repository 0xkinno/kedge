// Hand-written SVG set: 2px ink stroke, flat fills from tokens, one highlight, 24px grid, no gradients.
import type { SVGProps } from 'react';
const base = { fill: 'none', stroke: '#0C2536', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
type P = SVGProps<SVGSVGElement> & { title?: string };
const Svg = ({ title, children, ...p }: P) => (
  <svg viewBox="0 0 96 96" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} {...p}>{title ? <title>{title}</title> : null}{children}</svg>
);
/** The mark: a kedge anchor drawn as one continuous line whose rope loops into a K. Works at 16px. */
export const KedgeMark = (p: P) => (
  <Svg viewBox="0 0 48 48" {...p}>
    <path {...base} strokeWidth={3} d="M24 6v28M17 12h14M10 28c1 8 7 13 14 13s13-5 14-13M10 28l-3-4M38 28l3-4" />
    <path {...base} strokeWidth={3} stroke="#FF5A1F" d="M24 20c-6 0-10-3-10-7 0-3 3-5 6-3 3 2 2 7-2 9 6 1 10 5 14 9" />
  </Svg>
);
export const LifeboatCard = (p: P) => (
  <Svg {...p}><rect {...base} x="12" y="22" width="72" height="46" rx="6" fill="#F6F1E7" /><path {...base} d="M20 34h28M20 42h20" /><rect {...base} x="58" y="32" width="18" height="18" rx="2" fill="#EDE5D5" /><path {...base} stroke="#FF5A1F" d="M62 41h10M67 36v10" /><path {...base} stroke="#B88A2E" d="M20 58h56" /></Svg>
);
export const SignalFlagK = (p: P) => (
  <Svg {...p}><path {...base} d="M30 12v72" /><path {...base} d="M30 18h46v40H30z" fill="#FFFFFF" /><path d="M30 18h23v40H30z" fill="#123B52" stroke="#0C2536" strokeWidth={2} /><path d="M53 18h23v40H53z" fill="#F2C230" stroke="#0C2536" strokeWidth={2} /></Svg>
);
export const HourglassAnchor = (p: P) => (
  <Svg {...p}><path {...base} d="M28 12h40M28 84h40M32 12c0 18 16 22 16 36S32 66 32 84M64 12c0 18-16 22-16 36s16 18 16 36" /><path d="M36 18h24c-3 8-9 12-12 12s-9-4-12-12z" fill="#FF5A1F" stroke="#0C2536" strokeWidth={2} /><path {...base} d="M48 56v14M42 62h12M42 74c1 4 3 6 6 6s5-2 6-6" /></Svg>
);
export const AnchorRope = (p: P) => (
  <Svg {...p}><path {...base} d="M48 14v52M38 24h20M22 56c1 14 12 24 26 24s25-10 26-24M22 56l-6-8M74 56l6-8" /><circle {...base} cx="48" cy="12" r="5" fill="#EDE5D5" /><path {...base} stroke="#FF5A1F" d="M48 7c-10-4-22 0-26 10s0 20 10 22 18-6 14-14" /></Svg>
);
export const Lifebuoy = (p: P) => (
  <Svg {...p}><circle {...base} cx="48" cy="48" r="32" fill="#FF5A1F" /><circle {...base} cx="48" cy="48" r="14" fill="#F6F1E7" /><path d="M48 16v18M48 62v18M16 48h18M62 48h18" stroke="#F6F1E7" strokeWidth={8} /><circle {...base} cx="48" cy="48" r="32" /></Svg>
);
export const CompassRose = (p: P) => (
  <Svg {...p}><circle {...base} cx="48" cy="48" r="30" stroke="#B88A2E" /><path {...base} stroke="#B88A2E" d="M48 12l7 29 29 7-29 7-7 29-7-29-29-7 29-7z" fill="#F6F1E7" /><path d="M48 12l7 29-7 7z" fill="#B88A2E" /></Svg>
);
export const RopeDivider = (p: P) => (
  <svg viewBox="0 0 480 24" aria-hidden="true" {...p}><path {...base} stroke="#B88A2E" d="M0 12c20-14 40 14 60 0s40 14 60 0 40 14 60 0 40 14 60 0 40 14 60 0 40 14 60 0 40 14 60 0" /></svg>
);
export const SeamansBook = (p: P) => (
  <Svg {...p}><rect {...base} x="22" y="14" width="52" height="68" rx="4" fill="#123B52" /><circle {...base} cx="48" cy="40" r="11" stroke="#B88A2E" /><path {...base} stroke="#B88A2E" d="M48 31v18M42 34h12M41 44c1 3 3 4 7 4s6-1 7-4M32 64h32" /></Svg>
);
export const PhoneOverboard = (p: P) => (
  <Svg {...p}><path {...base} stroke="#1BB3A2" d="M8 66c8-5 14 5 22 0s14 5 22 0 14 5 22 0 10 3 14 1M8 78c8-5 14 5 22 0s14 5 22 0 14 5 22 0" /><rect {...base} x="38" y="14" width="22" height="38" rx="4" fill="#EDE5D5" transform="rotate(18 49 33)" /><path {...base} stroke="#FF5A1F" d="M70 56c3 4 3 8 0 12M76 52c5 7 5 13 0 20" /></Svg>
);
export const Flag = ({ letter, on }: { letter: string; on: boolean }) => (
  <span aria-label={`${letter} ${on ? 'approved' : 'waiting'}`} className={`inline-flex h-8 w-11 items-center justify-center rounded-sm border-2 border-ink font-display text-sm transition-transform ${on ? 'bg-sea-glass text-ink [transform:rotateX(0)]' : 'bg-paper-deep text-ink/50'}`}>{letter}</span>
);
