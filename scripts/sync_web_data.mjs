#!/usr/bin/env node
// Copies generated facts into the web app so it never carries typed numbers. A test fails if the copies drift.
import { copyFileSync, mkdirSync } from 'node:fs';
mkdirSync('apps/web/data', { recursive: true });
for (const [from, to] of [['docs/FACTS.json', 'apps/web/data/FACTS.json'], ['docs/landing_figures.json', 'apps/web/data/landing_figures.json'], ['deployments/testnet.json', 'apps/web/data/testnet.json']]) copyFileSync(from, to);
console.log('web data synced');
