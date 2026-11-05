#!/usr/bin/env node
// Logkeeper: writes docs/FACTS.json from real receipts in evidence/. Every headline number in README and UI comes from here.
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = Math.floor(s.length / 2); return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : null; };
export function buildFacts() {
  const dir = 'evidence/campaign'; const ev = {};
  for (const f of readdirSync(dir).filter((x) => /^[A-Z]\d+\.json$/.test(x))) { const j = JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')); ev[j.id] = j; }
  const probes = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => JSON.parse(readFileSync(`evidence/probe/part${n}.json`, 'utf8')));
  const dep = JSON.parse(readFileSync('deployments/testnet.json', 'utf8')).AllotmentVault;
  const order = ['H1', 'H2', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11', 'A12', 'C1', 'C2'];
  const scenarios = order.filter((id) => ev[id]).map((id) => { const e = ev[id];
    const txs = (e.txs ?? (e.tx ? [e.tx] : [])).filter((t) => t.hash); const key = e.tx ?? txs[txs.length - 1];
    return { id, title: e.title, expected: e.expected, pass: !!e.pass, observed: e.observedError ?? e.controlResult ?? null, proofTx: key ? { hash: key.hash, block: key.block, explorer: key.explorer } : null }; });
  const rescues = ['H1', 'H2'].filter((id) => ev[id]);
  // One classification. Every total below comes from it and from nothing else.
  const CLASSES = { onChainHappy: ['H1', 'H2'], onChainRefused: ['A1', 'A2', 'A3', 'A4', 'A6', 'A9'], onChainBehaviour: ['A5', 'A7', 'A8', 'A10'], uiRefused: ['A11', 'A12'], counterfactual: ['C1', 'C2'] };
  const passOf = (ids) => ids.filter((id) => ev[id]?.pass).length; const haveOf = (ids) => ids.filter((id) => ev[id]).length;
  const attackIds = [...CLASSES.onChainRefused, ...CLASSES.uiRefused].filter((id) => ev[id]);
  const summary = { total: scenarios.length, asExpected: scenarios.filter((s) => s.pass).length,
    classes: Object.fromEntries(Object.entries(CLASSES).map(([k, ids]) => [k, { ids: ids.filter((id) => ev[id]), asExpected: passOf(ids), of: haveOf(ids) }])),
    attacksStopped: passOf(attackIds), attacksTried: attackIds.length, note: 'Attacks stopped counts onChainRefused (decoded error on chain) plus uiRefused (a pre-flight or phrase guard). A5, A7, A8 and A10 are on-chain behaviours; C1 and C2 are counterfactuals.' };
  const legitFailed = [];
  for (const id of rescues) for (const t of ev[id].txs) if (!t.ok) legitFailed.push({ scenario: id, label: t.label, error: t.error });
  for (const f of ['ATTACK_RUN', 'PRIORITY_RUN']) if (existsSync(`${dir}/${f}.json`)) for (const t of JSON.parse(readFileSync(`${dir}/${f}.json`, 'utf8')).txs) if (!/^A\d/.test(t.label) && /legitimate|crew (initiate|approve|finish)|family (initiate|approve|finish)|set_friend_groups|^(lorna|ben) /.test(t.label) && !t.ok) legitFailed.push({ scenario: f, label: t.label, error: t.error });
  const h1 = ev.H1; const fee = (l) => Number(h1.txs.find((t) => t.label.startsWith(l))?.fee ?? 0);
  const rescueFee = ['initiate', 'approve', 'finish', 'control'].reduce((s, l) => s + fee(l), 0);
  const allTx = [];
  for (const [id, e] of Object.entries(ev)) for (const t of (e.txs ?? (e.tx ? [e.tx] : []))) if (t.hash && /^0x[0-9a-f]{64}$/.test(t.hash) && t.block && !allTx.some((x) => x.hash === t.hash)) allTx.push({ scenario: id, label: t.label, hash: t.hash, block: t.block, ok: t.ok, error: t.error ?? null, signer: t.signer });
  // Public-page drills: docs/drills/*.json. Newer records carry timings read from the page; the first two are stream captures without timings.
  const drillFiles = existsSync('docs/drills') ? readdirSync('docs/drills').filter((x) => /drill-\d+\.json$/.test(x)).sort() : [];
  const drillRecs = drillFiles.map((x) => JSON.parse(readFileSync(`docs/drills/${x}`, 'utf8')));
  const timed = drillRecs.map((d) => d.approvalToHomeSeconds).filter((x) => typeof x === 'number');
  const drills = { completed: drillRecs.filter((d) => d.completed !== false).length, withTiming: timed.length, approvalToHomeSeconds: timed.length ? { min: Math.min(...timed), median: median(timed), max: Math.max(...timed) } : null, dates: drillRecs.map((d) => d.date ?? d.at?.slice(0, 10)) };
  const uw = JSON.parse(readFileSync('evidence/watch/unattended-run.json', 'utf8'));
  const p = (n) => probes[n - 1];
  // ink! (WASM) contract on pallet-contracts: deployment record plus the live rescue that swept savings held inside it.
  const inkDep = JSON.parse(readFileSync('deployments/ink.json', 'utf8')); const inkRes = JSON.parse(readFileSync('evidence/ink/rescue.json', 'utf8')); const inkDry = JSON.parse(readFileSync('evidence/ink/dry-run.json', 'utf8'));
  const ink = { contract: inkDep.contract, deployTx: inkDep.ethHash, block: inkDep.block, wasmBytes: inkDep.wasmBytes, codeHash: inkDep.codeHash, costTPOT: Number(inkDep.costTPOT.toFixed(2)), storageDepositHeldTPOT: Number(inkDry.storageDepositTPOT),
    rescue: { pass: !!inkRes.pass, savedTPOT: Number(inkRes.saved) / 1e14, strangerWithdrawReverts: !!inkRes.strangerWithdrawReverts, itemsCompleted: inkRes.batchItems.filter((i) => i.status === 'completed').length, itemsTotal: inkRes.batchItems.length,
      oldWalletLeft: { tpot: inkRes.after.oldTpot, kusd: inkRes.after.oldKusd, ink: inkRes.after.oldInk }, txs: inkRes.steps.map((t) => ({ label: t.label, hash: t.hash, block: t.block, signer: t.signer })) } };
  return {
    network: 'portaldot-v3 testnet', spec: p(1).specVersion, blockTimeSeconds: p(1).blockTimeSeconds,
    vault: { address: dep.address, deployTx: dep.txHash, block: dep.block, costTPOT: Number(dep.costTPOT), tokenAssetId: dep.tokenAssetId },
    measured: {
      rescuesCompleted: rescues.filter((id) => ev[id].pass).length, rescuesAttempted: rescues.length,
      attacksStopped: summary.attacksStopped, attacksTried: summary.attacksTried,
      legitimateRescuesWronglyBlocked: legitFailed.length, wronglyBlockedCases: legitFailed,
      costPerProtectionTPOT: fee('set_friend_groups'), costPerRescueTPOT: Number(rescueFee.toFixed(6)),
      storageDepositRefundTPOT: Number(h1.storageDepositRefundTPOT), securityDepositTPOT: 0, friendGroupDepositTPOT: 0,
      delayBlocks: 10, delaySecondsMeasured: Math.round(h1.delaySeconds), kusdMoved: Number(h1.delta.heirKusd) / 1e6, tpotMoved: Number(Number(h1.delta.heirTpot).toFixed(2)),
    },
    watch: { unattendedDelivered: !!uw.deliveryConfirmed, trigger: uw.trigger, attemptBlock: uw.attemptBlock, runUrl: uw.workflowRunUrl, screenshot: uw.telegramScreenshot },
    ink, drills, summary, scenarios, misses: scenarios.filter((s) => !s.pass).map((s) => s.id),
    probeFindings: { headline_msgSenderIsLostH160: p(7).msgSenderIsLostH160, contractToPalletsAddressIsNoop: !p(8).remarkedEventSeen, receiptStatusOnFailedInner: p(7).failingInner.receiptStatus, hashRuleKeccakPayload: true },
    txs: allTx,
  };
}
if (process.argv[1].endsWith('facts.mjs')) { const f = buildFacts(); writeFileSync('docs/FACTS.json', JSON.stringify(f, null, 2) + '\n'); writeFileSync('docs/badge.json', JSON.stringify({ schemaVersion: 1, label: 'scenarios', message: `${f.summary.asExpected} of ${f.summary.total} as expected`, color: f.summary.asExpected === f.summary.total ? 'brightgreen' : 'orange' }) + '\n'); console.log(JSON.stringify(f.measured, null, 1), 'misses:', f.misses); }
