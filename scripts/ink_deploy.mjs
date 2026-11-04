#!/usr/bin/env node
// Deploy the ink! AllotmentInk contract to pallet-contracts, signed by the deployer through the pallets address.
// Usage: node scripts/ink_deploy.mjs [--max-tpot 100] [--dry]. Always dry-runs first and refuses to send above the cap.
import { connect, evm, wallet, sendRuntime, save } from './lib.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { u8aToHex } from '@polkadot/util';
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i < 0 ? d : process.argv[i + 1]; };
const cap = Number(arg('max-tpot', 100)); const dry = process.argv.includes('--dry');
const bundle = JSON.parse(readFileSync('ink/allotment_ink/target/ink/allotment_ink.contract', 'utf8'));
const code = bundle.source.wasm; const ctor = bundle.spec.constructors.find((c) => c.label === 'new').selector;
const api = await connect(); const w = wallet('deployer', evm());
const origin = u8aToHex(new Uint8Array([...Buffer.from(w.address.slice(2), 'hex'), ...new Uint8Array(12).fill(0xee)]));
const salt = '0x' + Buffer.from('kedge-ink-1').toString('hex');
const d = (await api.call.contractsApi.instantiate(origin, 0, null, null, { Upload: code }, ctor, salt)).toJSON();
const ok = d.result?.ok; const dep = BigInt(d.storageDeposit?.charge ?? 0); const gas = d.gasRequired;
const depT = Number(dep) / 1e14;
console.log(JSON.stringify({ wasmBytes: (code.length - 2) / 2, ctor, dryRunOk: !!ok, storageDepositTPOT: depT, gasRequired: gas, contract: ok?.accountId, err: d.result?.err }));
mkdirSync('evidence/ink', { recursive: true }); writeFileSync('evidence/ink/dry-run.json', JSON.stringify({ at: new Date().toISOString(), wasmBytes: (code.length - 2) / 2, storageDepositTPOT: depT, gasRequired: gas, contract: ok?.accountId }, null, 2) + '\n');
if (!ok) { console.error('dry run failed'); process.exit(1); }
if (dry) process.exit(0);
if (depT > cap) { console.error(`REFUSING: deposit ${depT} tPOT is above the cap of ${cap} tPOT`); process.exit(2); }
const call = api.tx.contracts.instantiateWithCode(0, { refTime: BigInt(gas.refTime) * 12n / 10n, proofSize: BigInt(gas.proofSize) * 12n / 10n }, dep * 12n / 10n + 10n ** 12n, code, ctor, salt).method.toHex();
const before = await evm().getBalance(w.address);
const r = await sendRuntime(api, w, call);
const inst = r.outcome.events.find((e) => e.event === 'contracts.Instantiated');
const after = await evm().getBalance(w.address);
const rec = { contract: inst?.data?.contract ?? ok.accountId, ethHash: r.hash, block: r.outcome.block, receiptStatus: r.receipt.status, events: r.outcome.events.map((e) => e.error ? `${e.event}:${e.error}` : e.event), costTPOT: Number(before - after) / 1e18, wasmBytes: (code.length - 2) / 2, codeHash: bundle.source.hash, deployedAt: new Date().toISOString() };
writeFileSync('deployments/ink.json', JSON.stringify(rec, null, 2) + '\n'); save('ink-deploy', rec); console.log(JSON.stringify(rec, null, 1));
await api.disconnect(); process.exit(rec.events.some((e) => /Failed|Revert/.test(e)) ? 1 : 0);
