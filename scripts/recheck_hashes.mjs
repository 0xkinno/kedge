// Re-resolve every Ethereum hash recorded in evidence/probe and report which matching rule applied.
import { connect, evm, resolve } from './lib.mjs';
import { readFileSync, readdirSync } from 'node:fs';
const hashes = new Set();
const walk = (o) => { if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { if (/ethHash|^hash$/.test(k) && /^0x[0-9a-f]{64}$/.test(v)) hashes.add(v); else walk(v); } };
for (const f of readdirSync('evidence/probe').filter((x) => /^part\d\.json$/.test(x))) walk(JSON.parse(readFileSync(`evidence/probe/${f}`, 'utf8')));
const api = await connect(); const p = evm(); let ok = 0, fb = 0;
for (const h of hashes) { const rc = await p.getTransactionReceipt(h); const r = await resolve(api, h, rc); const good = r.matchRule.startsWith('keccak'); good ? ok++ : fb++; console.log(h.slice(0, 12), 'block', r.block, 'ext', r.extrinsicIndex, good ? 'keccak rule' : r.matchRule); }
console.log(`keccak rule matched ${ok} of ${hashes.size}; fallback ${fb}`);
await api.disconnect(); process.exit(0);
