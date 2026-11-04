#!/usr/bin/env node
// Quality gates (Playwright Chromium). Usage: BASE=http://localhost:3100 node e2e/quality.mjs
// For each page and viewport: no horizontal scroll, one h1, visible focus ring, zero console errors, no overlapping key boxes, axe-core WCAG AA.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const axeSrc = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const BASE = process.env.BASE ?? 'http://localhost:3100';
const VIEWPORTS = [[360, 780], [390, 844], [430, 932], [768, 1024], [1024, 768], [1440, 900], [1920, 1080]];
const PAGES = ['/', '/harbour', '/crew', '/crew/0x85fbBA0fD74dAd192A277DCF5e8B83DA96FCA816', '/rescue', '/rescue/0x85fbBA0fD74dAd192A277DCF5e8B83DA96FCA816', '/proof', '/drill', '/judge'];
const results = []; const fails = [];
const browser = await chromium.launch(); mkdirSync('e2e/screens', { recursive: true });
for (const [w, h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  for (const path of PAGES) {
    const page = await ctx.newPage(); const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); }); page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => {
      const de = document.documentElement; const h1 = document.querySelectorAll('h1').length;
      const box = (el) => { const b = el.getBoundingClientRect(); return { l: b.left, t: b.top + scrollY, r: b.right, b: b.bottom + scrollY }; };
      const hit = (a, b) => a.l < b.r - 1 && a.r > b.l + 1 && a.t < b.b - 1 && a.b > b.t + 1;
      const key = [...document.querySelectorAll('main h1, main h2, main [data-key], main button, main a.rounded-xl')].filter((e) => e.offsetParent !== null && e.getBoundingClientRect().height > 0);
      const overlaps = []; const boxes = key.map((e) => [e, box(e)]);
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) { const [ea, a] = boxes[i], [eb, b] = boxes[j]; if (ea.contains(eb) || eb.contains(ea)) continue; if (hit(a, b)) overlaps.push(`${ea.tagName}:${(ea.textContent || '').trim().slice(0, 24)} x ${eb.tagName}:${(eb.textContent || '').trim().slice(0, 24)}`); }
      return { hscroll: de.scrollWidth > de.clientWidth + 1, h1, overlaps: overlaps.slice(0, 4) };
    });
    await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
    const focus = await page.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return false; const s = getComputedStyle(e); return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2; });
    await page.evaluate(axeSrc);
    const axe = await page.evaluate(async () => { const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } }); return r.violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0]?.html.slice(0, 100) })); });
    const rec = { viewport: `${w}x${h}`, path, ...r, focusRing: focus, consoleErrors: errors.slice(0, 3), axe };
    const bad = [r.hscroll && 'horizontal scroll', r.h1 !== 1 && `h1 count ${r.h1}`, !focus && 'no visible focus ring', errors.length && `console errors: ${errors[0]?.slice(0, 120)}`, r.overlaps.length && `overlap ${r.overlaps[0]}`, axe.length && `axe ${axe.map((a) => a.id).join(',')}`].filter(Boolean);
    results.push({ ...rec, bad }); if (bad.length) fails.push(`${rec.viewport} ${path}: ${bad.join('; ')}`);
    if (['/', '/proof'].includes(path)) await page.screenshot({ path: `e2e/screens/${path === '/' ? 'home' : 'proof'}-${w}.png`, fullPage: false });
    await page.close();
  }
  await ctx.close();
}
await browser.close();
writeFileSync('e2e/quality-report.json', JSON.stringify({ base: BASE, at: new Date().toISOString(), checks: results.length, failures: fails }, null, 2) + '\n');
console.log(`${results.length} page-viewport checks, ${fails.length} failing`); for (const f of fails.slice(0, 40)) console.log('FAIL', f);
process.exit(fails.length ? 1 : 0);
