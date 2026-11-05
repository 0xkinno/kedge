#!/usr/bin/env node
// Runs ONE real drill from the public /drill page and records it. Timings are what the page shows, read once a second.
// Usage: BASE=https://kedge-kinnoskis-projects.vercel.app node e2e/drill_record.mjs   -> docs/drills/<date>-drill-<n>.json
import { createRequire } from 'node:module'; import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const BASE = process.env.BASE ?? 'https://kedge-kinnoskis-projects.vercel.app';
const b = await chromium.launch(); const pg = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
await pg.goto(BASE + '/drill', { waitUntil: 'networkidle' }); const t0 = Date.now(); await pg.getByRole('button', { name: 'Start the drill' }).click();
const seen = {}; const want = [['Crew named', 'named'], ['Attempt started by Lorna', 'started'], ['Ben approved', 'approved'], ['Safety delay passed', 'delayPassed'], ['Inheritor set', 'finished'], ['Brought home', 'broughtHome']];
let done = false, error = null;
for (let i = 0; i < 400 && !done && !error; i++) { // up to ~7 minutes
  const txt = await pg.locator('main').innerText(); const el = Math.round((Date.now() - t0) / 1000);
  for (const [needle, key] of want) if (!(key in seen) && txt.includes(needle)) seen[key] = el;
  done = /Done\./.test(txt); if (/The drill stopped/.test(txt)) error = txt.split('The drill stopped.')[1]?.split('\n')[0]?.trim() ?? 'stopped';
  if (!done && !error) await pg.waitForTimeout(1000);
}
const links = await pg.locator('main a[href*="scanner-testnet"]').evaluateAll((a) => a.map((x) => x.href));
const receipt = (await pg.locator('main').innerText()).match(/[\d.]+ tPOT moved from the old wallet to the new phone, in one signature/)?.[0] ?? null;
mkdirSync('docs/drills', { recursive: true }); const n = readdirSync('docs/drills').filter((x) => /drill-\d+\.json$/.test(x)).length + 1; const date = new Date().toISOString().slice(0, 10);
const rec = { drill: n, date, at: new Date().toISOString(), url: BASE + '/drill', completed: done && !error, error, secondsFromStart: seen, approvalToHomeSeconds: seen.approved != null && seen.broughtHome != null ? seen.broughtHome - seen.approved : null, totalSeconds: Math.round((Date.now() - t0) / 1000), explorerLinks: links, receipt, note: 'Started by pressing Start on the public /drill page; house crew keys sign. Timings are read from the page once a second.' };
writeFileSync(`docs/drills/${date}-drill-${n}.json`, JSON.stringify(rec, null, 2) + '\n'); console.log(JSON.stringify({ drill: n, completed: rec.completed, approvalToHomeSeconds: rec.approvalToHomeSeconds, totalSeconds: rec.totalSeconds, links: links.length, receipt }));
await b.close(); process.exit(rec.completed ? 0 : 1);
