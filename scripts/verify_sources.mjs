#!/usr/bin/env node
// Keyless check: re-fetch every URL in docs/sources.json and confirm the quote is on the page.
import { readFileSync } from 'node:fs';
const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36';
const decode = (s) => s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
  .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const text = (h) => decode(h.replace(/<(script|style)[\s\S]*?<\/\1>/gi, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
const { sources } = JSON.parse(readFileSync('docs/sources.json', 'utf8'));
let bad = 0;
const cache = new Map();
for (const s of sources) {
  try {
    if (!cache.has(s.url)) {
      const r = await fetch(s.url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(40000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      cache.set(s.url, text(await r.text()));
    }
    const ok = cache.get(s.url).includes(s.quote);
    console.log(`${ok ? 'ok  ' : 'MISS'} ${s.id}`);
    if (!ok) bad++;
  } catch (e) { console.log(`ERR  ${s.id}: ${e.message}`); bad++; }
}
process.exit(bad ? 1 : 0);
