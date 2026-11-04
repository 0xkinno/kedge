#!/usr/bin/env node
// Curls every public path after a deploy. Usage: BASE=https://your-url node scripts/reachability.mjs
const BASE = process.env.BASE ?? 'http://localhost:3100';
const H = '0x85fbBA0fD74dAd192A277DCF5e8B83DA96FCA816';
const paths = ['/', '/harbour', '/crew', `/crew/${H}`, '/rescue', `/rescue/${H}`, '/proof', '/drill', '/judge', '/api/status', '/api/facts', `/api/lookout?lost=${H}`, '/textures/contours.svg'];
let bad = 0;
for (const p of paths) { const t0 = Date.now(); try { const r = await fetch(BASE + p, { signal: AbortSignal.timeout(30000) }); const ok = r.status === 200; if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${r.status} ${Date.now() - t0}ms ${p}`); } catch (e) { bad++; console.log(`FAIL ${p} ${e.message}`); } }
console.log(bad ? `${bad} unreachable` : 'all public paths reachable'); process.exit(bad ? 1 : 0);
