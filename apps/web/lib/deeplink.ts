// Deep link door for visiting dApps: /protect?app=<name>&return=<url>&guardians=<a,b,c>&need=<n>
// Only https return URLs are accepted, names are length-limited text, and guardians must be valid addresses.
import { isAddress } from 'ethers';
export type Door = { app?: string; ret?: string; guardians: string[]; need?: number };
export function cleanDoor(sp: URLSearchParams | Record<string, string | string[] | undefined>): Door {
  const get = (k: string) => { const v = sp instanceof URLSearchParams ? sp.get(k) : sp[k]; return Array.isArray(v) ? v[0] : v ?? undefined; };
  const app = (get('app') ?? '').replace(/[^\p{L}\p{N} ._-]/gu, '').trim().slice(0, 40) || undefined;
  let ret: string | undefined; const r = get('return');
  if (r && r.length <= 500) { try { const u = new URL(r); if (u.protocol === 'https:' && !u.username && !u.password) ret = u.toString(); } catch { /* not a URL: dropped */ } }
  const guardians = (get('guardians') ?? '').split(',').map((s) => s.trim()).filter(isAddress).slice(0, 3);
  const n = Number(get('need')); const need = Number.isInteger(n) && n >= 1 && n <= 3 ? n : undefined;
  return { app, ret, guardians, need };
}
export const doorQuery = (d: Door) => { const q = new URLSearchParams(); if (d.app) q.set('app', d.app); if (d.ret) q.set('return', d.ret); if (d.guardians.length) q.set('guardians', d.guardians.join(',')); if (d.need) q.set('need', String(d.need)); return q.toString(); };
