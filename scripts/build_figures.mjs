#!/usr/bin/env node
// Derives the landing-page money figure from docs/sources.json. The figure is never typed by hand.
import { readFileSync, writeFileSync } from 'node:fs';
const { sources } = JSON.parse(readFileSync('docs/sources.json', 'utf8'));
const s = sources.find((x) => x.id === 'sea-remittances');
const out = { money: { ...s.figure, sourceId: s.id, sourceUrl: s.url, sentence: `Sea-based Filipino workers sent home ${s.figure.display} in ${s.figure.year}.` } };
writeFileSync('docs/landing_figures.json', JSON.stringify(out, null, 2) + '\n');
console.log(out.money.sentence);
