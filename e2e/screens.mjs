import { createRequire } from 'node:module'; import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const BASE = process.env.BASE ?? 'http://localhost:3100'; const lost = JSON.parse(readFileSync('evidence/campaign/H1.json', 'utf8')).lost;
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 }); const pg = await ctx.newPage();
const shots = [['landing', '/'], ['harbour', '/harbour'], ['crew', `/crew/${lost}`], ['rescue', `/rescue/${lost}`], ['proof', '/proof']];
for (const [n, p] of shots) { await pg.goto(BASE + p, { waitUntil: 'networkidle' }); await pg.waitForTimeout(1500); await pg.screenshot({ path: `docs/screens/${n}.png` }); console.log('shot', n); }
await pg.goto(BASE + '/', { waitUntil: 'networkidle' }); await pg.waitForTimeout(800);
await pg.screenshot({ path: 'docs/brand/kedge-banner.png', clip: { x: 0, y: 0, width: 1440, height: 640 } });
await b.close();
