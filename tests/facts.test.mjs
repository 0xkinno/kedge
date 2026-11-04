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
test('README states the same headline numbers as FACTS', () => {
  const f = JSON.parse(read('docs/FACTS.json')).measured; const r = read('README.md');
  for (const s of [`${f.rescuesCompleted} of ${f.rescuesAttempted} rescues completed`, `${f.attacksStopped} of ${f.attacksTried} attacks stopped`, `**${f.legitimateRescuesWronglyBlocked}** legitimate rescues wrongly blocked`, `${f.costPerRescueTPOT} tPOT in fees per rescue`]) assert.ok(r.includes(s), `README is missing: ${s}`);
});
