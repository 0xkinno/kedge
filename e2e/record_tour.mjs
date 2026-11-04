// Records the guided tour (render mode) as a silent WebM. Source for the demo video; live wallet clips are added by the owner.
import { createRequire } from 'node:module'; import { renameSync, rmSync, mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const BASE = process.env.BASE ?? 'http://localhost:3100';
mkdirSync('docs/demo/_tmp', { recursive: true });
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: 'docs/demo/_tmp', size: { width: 1280, height: 720 } } });
const pg = await ctx.newPage(); await pg.goto(`${BASE}/?tour=1&render=1`, { waitUntil: 'networkidle' });
await pg.waitForTimeout(7 * 6000 + 3000); const v = pg.video(); await ctx.close(); const path = await v.path(); renameSync(path, 'docs/demo/tour-silent.webm'); rmSync('docs/demo/_tmp', { recursive: true, force: true }); await b.close(); console.log('docs/demo/tour-silent.webm written');
