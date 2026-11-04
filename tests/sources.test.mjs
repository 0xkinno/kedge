import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));

test('every source has url, title, quote, date opened', () => {
  for (const s of read('docs/sources.json').sources) {
    for (const k of ['id', 'url', 'title', 'quote', 'date_opened', 'claim']) assert.ok(s[k], `${s.id} missing ${k}`);
    assert.match(s.url, /^https:\/\//);
  }
});

test('landing money figure equals the figure in sources.json and appears in its quote', () => {
  const src = read('docs/sources.json').sources.find((x) => x.id === 'sea-remittances');
  const page = read('docs/landing_figures.json').money;
  assert.equal(page.display, src.figure.display);
  assert.equal(page.value, src.figure.value);
  assert.equal(page.year, src.figure.year);
  assert.ok(src.quote.includes(src.figure.display), 'quote must contain the displayed figure');
  assert.ok(src.quote.includes(String(src.figure.year)), 'quote must contain the year');
});
