import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildFacts } from '../scripts/facts.mjs';
const read = (p) => readFileSync(p, 'utf8');
test('docs/FACTS.json equals what facts.mjs generates from the evidence (no drift)', () => {
  assert.deepEqual(JSON.parse(read('docs/FACTS.json')), JSON.parse(JSON.stringify(buildFacts())));
});
test('web copies of generated data equal the originals', () => {
  for (const [a, b] of [['docs/FACTS.json', 'apps/web/data/FACTS.json'], ['docs/landing_figures.json', 'apps/web/data/landing_figures.json'], ['deployments/testnet.json', 'apps/web/data/testnet.json']]) assert.equal(read(a), read(b), `${b} drifted`);
});
test('every scenario passed or is listed as a miss, and counts are consistent', () => {
  const f = JSON.parse(read('docs/FACTS.json'));
  assert.equal(f.misses.length, f.scenarios.filter((s) => !s.pass).length);
  assert.ok(f.measured.attacksStopped <= f.measured.attacksTried && f.measured.rescuesCompleted <= f.measured.rescuesAttempted);
  assert.equal(f.measured.legitimateRescuesWronglyBlocked, f.measured.wronglyBlockedCases.length);
});
test('README and UI do not type the headline numbers by hand', () => {
  const home = read('apps/web/app/page.tsx'); assert.ok(!/\b(9 of 9|2 of 2)\b/.test(home), 'landing must read numbers from FACTS');
});
test('README states the same headline numbers as FACTS', async () => {
  const { fmtTpot } = await import('../packages/kedge-kit/src/fmt.mjs');
  const f = JSON.parse(read('docs/FACTS.json')).measured; const r = read('README.md');
  for (const s of [`${f.rescuesCompleted} of ${f.rescuesAttempted} rescues completed`, `${f.attacksStopped} of ${f.attacksTried} attacks stopped`, `**${f.legitimateRescuesWronglyBlocked}** honest rescues wrongly blocked`, `${fmtTpot(f.costPerRescueTPOT)} tPOT in fees per rescue`]) assert.ok(r.includes(s), `README is missing: ${s}`);
});
test('summary classification: totals come from one block and match the scenarios', () => {
  const f = JSON.parse(read('docs/FACTS.json')); const s = f.summary;
  const ids = Object.values(s.classes).flatMap((c) => c.ids).sort();
  assert.deepEqual(ids, f.scenarios.map((x) => x.id).sort(), 'every scenario is in exactly one class');
  assert.equal(s.total, f.scenarios.length); assert.equal(s.asExpected, f.scenarios.filter((x) => x.pass).length);
  assert.equal(f.measured.attacksStopped, s.classes.onChainRefused.asExpected + s.classes.uiRefused.asExpected);
  assert.equal(f.measured.attacksTried, s.classes.onChainRefused.of + s.classes.uiRefused.of);
  const badge = JSON.parse(read('docs/badge.json')); assert.equal(badge.message, `${s.asExpected} of ${s.total} as expected`);
  assert.ok(read('README.md').includes(`${s.asExpected} of ${s.total} scenarios as expected`), 'README states the generated scenario total');
});
test('prose rounds tPOT to three decimals', async () => {
  const { fmtTpot } = await import('../packages/kedge-kit/src/fmt.mjs');
  assert.equal(fmtTpot(0.027005), '0.027'); assert.equal(fmtTpot(13.99135), '13.991'); assert.equal(fmtTpot(0.06293), '0.063'); assert.equal(fmtTpot(2), '2');
});
