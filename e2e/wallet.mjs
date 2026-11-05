#!/usr/bin/env node
// End-to-end wallet test in headless Chromium. An EIP-1193 provider is injected into each page and backed by a real key held in this
// Node process (ethers). Every transaction is signed and sent to the live Portaldot V3 testnet. This is an injected test wallet, NOT the
// Rabby or SubWallet extension: it proves the app's connect, switch-chain, sign-message and send-transaction paths against real signing.
// Usage: BASE=http://localhost:3100 node e2e/wallet.mjs [steps...]   Videos and screenshots go to docs/demo/test-run/
import { createRequire } from 'node:module'; import { readFileSync, writeFileSync, mkdirSync, renameSync, readdirSync } from 'node:fs';
const require = createRequire(import.meta.url); const { chromium } = require('playwright'); const { JsonRpcProvider, Wallet } = require('ethers');
const BASE = process.env.BASE ?? 'http://localhost:3100'; const OUT = process.env.OUT ?? 'docs/demo/test-run'; mkdirSync(OUT, { recursive: true });
const provider = new JsonRpcProvider('https://test-evm-rpc-v3.portaldot.dev', { chainId: 420420777, name: 'portaldot-v3' }, { staticNetwork: true });
const key = (n) => JSON.parse(readFileSync(`keys/${n}.json`, 'utf8')); const wal = (n) => new Wallet(key(n).privateKey, provider);
const results = []; const only = new Set(process.argv.slice(2));
const browser = await chromium.launch();
async function actor(name, wallet, { w = 1280, h = 800, video = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, ...(video ? { recordVideo: { dir: `${OUT}/_v_${name}`, size: { width: Math.min(w, 1280), height: Math.min(h, 800) } } } : {}), acceptDownloads: true });
  await ctx.exposeFunction('__wallet', async (method, params) => {
    switch (method) {
      case 'eth_requestAccounts': case 'eth_accounts': return [wallet.address.toLowerCase()];
      case 'eth_chainId': return '0x190f1ca9';
      case 'wallet_switchEthereumChain': case 'wallet_addEthereumChain': return null;
      case 'personal_sign': return wallet.signMessage(params[0]);
      case 'eth_sendTransaction': { const t = params[0]; const r = await wallet.sendTransaction({ to: t.to, data: t.data, gasLimit: t.gas, gasPrice: t.gasPrice, value: t.value ?? 0 }); return r.hash; }
      default: return provider.send(method, params ?? []);
    }
  });
  await ctx.addInitScript(() => { window.ethereum = { isKedgeTestWallet: true, request: ({ method, params }) => window.__wallet(method, params ?? []), on() {}, removeListener() {} }; });
  const page = await ctx.newPage(); page.on('pageerror', (e) => results.push({ step: `${name} pageerror`, ok: false, detail: String(e).slice(0, 160) }));
  return { ctx, page, name, async close() { const v = page.video(); await ctx.close(); try { const p = await v.path(); renameSync(p, `${OUT}/${name}.webm`); } catch {} } };
}
async function step(name, fn) { if (only.size && !only.has(name.split(' ')[0])) return null; const t0 = Date.now(); try { const d = await fn(); results.push({ step: name, ok: true, secs: Math.round((Date.now() - t0) / 1000), detail: d ?? '' }); console.log('PASS', name, d ?? ''); return d; } catch (e) { results.push({ step: name, ok: false, secs: Math.round((Date.now() - t0) / 1000), detail: String(e.message).slice(0, 300) }); console.log('FAIL', name, String(e.message).slice(0, 200)); return null; } }
const shot = (a, n) => a.page.screenshot({ path: `${OUT}/${n}.png` });
const fundNew = async (tpot) => { const w = Wallet.createRandom().connect(provider); const t = await wal('deployer').sendTransaction({ to: w.address, value: BigInt(Math.round(tpot * 1e6)) * 10n ** 12n, gasLimit: 6_000_000_000_000n, gasPrice: (await provider.getFeeData()).gasPrice }); await t.wait(); return w; };
const addr = (n) => key(n).h160;

// ---- A. Deployer wallet: connect, sign, alerts
await step('A1 connect deployer wallet and subscribe to alerts (EIP-191 signature)', async () => {
  const a = await actor('A-deployer', wal('deployer')); const p = a.page; await p.goto(BASE + '/harbour'); await p.getByRole('button', { name: 'Connect wallet' }).first().click();
  await p.getByLabel('Connected wallet').waitFor({ timeout: 20000 }); const shown = await p.getByLabel('Connected wallet').innerText();
  if (shown.toLowerCase() !== wal('deployer').address.toLowerCase()) throw new Error('wrong address shown ' + shown);
  await p.getByLabel('Telegram chat id').fill('123456789'); await p.getByRole('button', { name: 'Turn on alerts' }).click();
  await p.getByText('Alerts on.').waitFor({ timeout: 20000 }); await shot(a, 'A1-deployer-connected-alerts'); await a.close(); return shown;
});
// ---- B. Lifeboat key + PDF card (no chain tx)
await step('B1 Lifeboat key made in the browser and the card PDF downloads', async () => {
  const a = await actor('B-lifeboat-card', wal('deployer')); const p = a.page; await p.goto(BASE + '/harbour'); await p.getByRole('button', { name: 'Connect wallet' }).first().click(); await p.getByLabel('Connected wallet').waitFor();
  await p.getByLabel('Passphrase (8 or more characters)').fill('correct horse battery'); await p.getByRole('button', { name: 'Make my Lifeboat key' }).click();
  await p.getByText('New wallet:').waitFor({ timeout: 30000 }); const [dl] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: /Download Lifeboat Card/ }).click()]);
  const path = `${OUT}/lifeboat-card.pdf`; await dl.saveAs(path); const head = readFileSync(path).subarray(0, 5).toString(); if (head !== '%PDF-') throw new Error('not a PDF'); await shot(a, 'B1-lifeboat-card'); await a.close(); return `${dl.suggestedFilename()} ${readFileSync(path).length} bytes`;
});
// ---- C. Full rescue with real wallets
let owner, ownerAddr;
await step('C1 owner protects a wallet from Harbour (set_friend_groups through the wallet)', async () => {
  owner = await fundNew(3); ownerAddr = owner.address; const a = await actor('C-owner', owner); const p = a.page; await p.goto(BASE + '/harbour');
  await p.getByRole('button', { name: 'Connect wallet' }).first().click(); await p.getByLabel('Connected wallet').waitFor();
  await p.getByLabel('Guardian 1 wallet address').fill(addr('lorna')); await p.getByLabel('Guardian 2 wallet address').fill(addr('ben')); await p.getByLabel('Guardian 3 wallet address').fill(addr('ana'));
  await p.getByLabel('New-phone wallet (inheritor)').fill(addr('lifeboat'));
  await p.getByRole('button', { name: 'Protect my wallet' }).click(); await p.getByText('Completed').first().waitFor({ timeout: 90000 }); await p.getByText('Protected', { exact: true }).waitFor({ timeout: 30000 });
  await shot(a, 'C1-owner-protected'); await a.close(); return ownerAddr;
});
let words;
await step('C2 new phone shows the four-word call phrase', async () => {
  const a = await actor('C-newphone', wal('lifeboat')); const p = a.page; await p.goto(`${BASE}/rescue/${ownerAddr}`); await p.getByRole('button', { name: 'Connect new phone' }).click();
  await p.getByTestId('call-phrase').waitFor({ timeout: 30000 }); words = (await p.getByTestId('call-phrase').innerText()).trim().split(/\s+/); if (words.length !== 4) throw new Error('phrase length ' + words.length); await shot(a, 'C2-newphone-phrase'); await a.close(); return words.join(' ');
});
const guardian = async (who, label) => { const a = await actor(who, wal(who)); const p = a.page; await p.goto(`${BASE}/crew/${ownerAddr}`); await p.getByRole('button', { name: 'Connect wallet' }).click();
  const b = p.getByRole('button', { name: /^(Start|Approve)$/ }); await b.waitFor({ timeout: 30000 });
  if (await b.isEnabled()) throw new Error('approve must be locked before the phrase is typed');
  await p.getByLabel('Word 1').fill('wrong'); await p.getByLabel('Word 2').fill('words'); await p.getByLabel('Word 3').fill('here'); await p.getByLabel('Word 4').fill('now');
  await p.getByText('do not match').waitFor(); if (await b.isEnabled()) throw new Error('mismatch must keep the button locked'); await shot(a, `${label}-mismatch-locked`);
  for (let i = 0; i < 4; i++) await p.getByLabel(`Word ${i + 1}`).fill(words[i]); await p.getByText('The words match').waitFor(); if (!(await b.isEnabled())) throw new Error('button should unlock on match');
  await b.click(); await p.getByText('Completed').first().waitFor({ timeout: 90000 }); await shot(a, `${label}-done`); await a.close(); };
await step('D1 guardian Lorna: locked on a wrong phrase, unlocks on the right one, starts the attempt', async () => { await guardian('lorna', 'D1-lorna'); return 'attempt started'; });
await step('D2 guardian Ben: same gate, approves', async () => { await guardian('ben', 'D2-ben'); return 'approved'; });
await step('E1 safety delay passes and the new phone brings everything home in one signature', async () => {
  const a = await actor('E-bringhome', wal('lifeboat')); const p = a.page; await p.goto(`${BASE}/rescue/${ownerAddr}`); await p.getByRole('button', { name: 'Connect new phone' }).click();
  await p.getByText('Will move').first().waitFor({ timeout: 60000 }); const btn = p.getByRole('button', { name: 'Bring it home' });
  await p.waitForFunction(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent === 'Bring it home'); return b && !b.disabled; }, null, { timeout: 150000 });
  await shot(a, 'E1-ready'); await btn.click(); await p.getByRole('heading', { name: 'Receipt' }).waitFor({ timeout: 120000 }); await p.getByText('Bring it home (one signature)').waitFor();
  const rows = await p.locator('section[aria-labelledby=receipt] li').allInnerTexts(); await shot(a, 'E1-receipt'); await a.close();
  if (!rows.some((r) => /bring it home/i.test(r) && /completed/i.test(r)) || rows.some((r) => /failed/i.test(r))) throw new Error('sweep not completed: ' + rows.join(' / ')); return rows.map((r) => r.replace(/\s+/g, ' ')).join(' | ');
});
// ---- F. stop and slash from the owner's alert link
await step('F1 owner stops an attempt he did not start (alert link), then slashes a second one', async () => {
  const o2 = await fundNew(3); const a = await actor('F-owner-stop', o2); const p = a.page;
  await p.goto(BASE + '/harbour'); await p.getByRole('button', { name: 'Connect wallet' }).first().click(); await p.getByLabel('Connected wallet').waitFor();
  await p.getByLabel('Guardian 1 wallet address').fill(addr('lorna')); await p.getByLabel('Guardian 2 wallet address').fill(addr('ben')); await p.getByLabel('Guardian 3 wallet address').fill(addr('ana')); await p.getByLabel('New-phone wallet (inheritor)').fill(addr('lifeboat'));
  await p.getByRole('button', { name: 'Protect my wallet' }).click(); await p.getByText('Completed').first().waitFor({ timeout: 90000 });
  const scale = await import('../watch/scale.mjs');
  const lost32 = '0x' + o2.address.slice(2).toLowerCase() + 'ee'.repeat(12); const lorna = wal('lorna'); const gp = (await provider.getFeeData()).gasPrice;
  const start = async () => { const t = await lorna.sendTransaction({ to: '0x6d6f646c70792f70616464720000000000000000', data: scale.initiateAttempt(lost32, 0), gasLimit: 30_000_000_000_000n, gasPrice: gp }); await t.wait(); };
  await start(); await p.goto(BASE + '/harbour?act=stop'); await p.getByRole('button', { name: 'Connect wallet' }).first().click(); await p.getByText('An attempt is open on your wallet').waitFor({ timeout: 30000 }); await shot(a, 'F1-alert-open');
  await p.getByRole('button', { name: 'Stop this attempt' }).click(); await p.getByText('Attempt stopped').waitFor({ timeout: 90000 }); await shot(a, 'F1-stopped');
  await start(); await p.goto(BASE + '/harbour?act=slash'); await p.getByRole('button', { name: 'Connect wallet' }).first().click(); await p.getByText('An attempt is open on your wallet').waitFor({ timeout: 30000 });
  await p.getByRole('button', { name: 'Slash the starter' }).click(); await p.getByText('Attempt slashed').waitFor({ timeout: 90000 }); await shot(a, 'F1-slashed'); await a.close(); return 'stopped then slashed';
});
// ---- G. proof, tour, drill
await step('G1 Proof page decodes a refused attack (A3) in the browser from the public node', async () => {
  const a = await actor('G-proof', wal('deployer')); const p = a.page; await p.goto(BASE + '/proof'); await p.getByRole('button', { name: 'A3', exact: true }).click(); await p.getByRole('button', { name: 'Check' }).first().click();
  await p.getByText('recovery.NotYetInheritable').first().waitFor({ timeout: 90000 }); await shot(a, 'G1-proof-decoded'); await a.close(); return 'recovery.NotYetInheritable decoded';
});
await step('G2 guided tour runs through all 7 steps with the keyboard', async () => {
  const a = await actor('G-tour', wal('deployer')); const p = a.page; await p.goto(BASE + '/?tour=1'); await p.getByText('Step 1 of 7').waitFor();
  for (let i = 2; i <= 7; i++) { await p.keyboard.press('ArrowRight'); await p.getByText(`Step ${i} of 7`).waitFor({ timeout: 15000 }); await p.waitForTimeout(1300); if (i === 4) await shot(a, 'G2-tour-step4'); }
  await p.getByRole('button', { name: 'Finish' }).click(); await p.waitForURL(/\/judge/); await a.close(); return 'seven steps, finished on /judge';
});
await step('G3 Muster Drill runs a full rescue from the page', async () => {
  const a = await actor('G-drill', wal('deployer')); const p = a.page; await p.goto(BASE + '/drill'); await p.getByRole('button', { name: 'Start the drill' }).click();
  await p.getByText('moved from the old wallet').waitFor({ timeout: 240000 }); await p.getByText('Done.').waitFor({ timeout: 30000 }); await shot(a, 'G3-drill-done'); await a.close(); return 'drill finished';
});
await step('I1 deep link door: a visiting dApp sends the owner to Harbour pre-filled and the owner is returned after signing', async () => {
  const o = await fundNew(3); const a = await actor('I-door', o); const p = a.page; const back = 'https://example.com/moon-wallet/done';
  await p.goto(`${BASE}/protect?app=Moon%20Wallet&return=${encodeURIComponent(back)}&guardians=${addr('lorna')},${addr('ben')},${addr('ana')}&need=2`);
  await p.getByText('asked you to protect').waitFor(); if ((await p.getByLabel('Guardian 3 wallet address').inputValue()).toLowerCase() !== addr('ana').toLowerCase()) throw new Error('guardians not pre-filled');
  await p.getByRole('button', { name: 'Connect wallet' }).first().click(); await p.getByLabel('Connected wallet').waitFor();
  await p.getByLabel('New-phone wallet (inheritor)').fill(addr('lifeboat')); await shot(a, 'I1-door-prefilled');
  await p.getByRole('button', { name: 'Protect my wallet' }).click(); await p.getByText('Completed').first().waitFor({ timeout: 90000 });
  await p.getByText('Returning to').waitFor({ timeout: 30000 }); const href = await p.getByRole('link', { name: 'Return now' }).getAttribute('href'); if (href !== back) throw new Error('return link wrong: ' + href);
  await shot(a, 'I1-door-returning'); await a.close(); return `signed, then a return link to ${new URL(back).hostname}`;
});
await step('H1 mobile (390 px): connect and protect form usable, no horizontal scroll', async () => {
  const a = await actor('H-mobile', wal('deployer'), { w: 390, h: 844 }); const p = a.page; await p.goto(BASE + '/harbour'); await p.getByRole('button', { name: 'Connect wallet' }).first().click(); await p.getByLabel('Connected wallet').waitFor();
  const sw = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth); if (sw > 1) throw new Error('horizontal scroll ' + sw); await shot(a, 'H1-mobile-harbour'); await a.close(); return 'ok';
});
await browser.close();
writeFileSync(`${OUT}/results.json`, JSON.stringify({ at: new Date().toISOString(), base: BASE, wallet: 'injected EIP-1193 test wallet (ethers-backed), not the Rabby or SubWallet extension', results }, null, 2) + '\n');
const bad = results.filter((r) => !r.ok); console.log(`\n${results.length - bad.length} of ${results.length} steps passed`); for (const b of bad) console.log('FAILED:', b.step, '|', b.detail); process.exit(bad.length ? 1 : 0);
