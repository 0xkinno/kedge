#!/usr/bin/env node
// Usage: node scripts/save_vault.mjs <keyName> <kUSD amount>. approve (ERC-20 precompile) + save (vault) from the person's own EOA.
import { evm, wallet, KUSD_ID, assetPrecompile, save, connect } from './lib.mjs';
import { readFileSync } from 'node:fs';
import { Contract, Interface } from 'ethers';
const [name, amt] = [process.argv[2] ?? 'ramon', BigInt(process.argv[3] ?? 150) * 10n ** 6n];
const p = evm(); const w = wallet(name, p);
const dep = JSON.parse(readFileSync('deployments/testnet.json', 'utf8')).AllotmentVault;
const erc = new Contract(assetPrecompile(KUSD_ID), ['function approve(address,uint256) returns (bool)', 'function balanceOf(address) view returns (uint256)', 'function allowance(address,address) view returns (uint256)'], w);
const vault = new Contract(dep.address, JSON.parse(readFileSync('contracts/artifacts/AllotmentVault.json', 'utf8')).abi, w);
const price = (await p.getFeeData()).gasPrice;
const t = async (label, fn) => { const tx = await fn(price); const r = await tx.wait(); console.log(label, tx.hash, 'status', r.status, 'block', r.blockNumber); return { label, hash: tx.hash, block: r.blockNumber, status: r.status }; };
console.log('kUSD balance before', (await erc.balanceOf(w.address)).toString());
const out = [];
const g1 = await erc.approve.estimateGas(dep.address, amt); out.push(await t('approve', (gp) => erc.approve(dep.address, amt, { gasLimit: g1 * 13n / 10n, gasPrice: gp })));
const g2 = await vault.save.estimateGas(amt); out.push(await t('save', (gp) => vault.save(amt, { gasLimit: g2 * 13n / 10n, gasPrice: gp })));
const s = await vault.savingsOf(w.address); console.log('vault savingsOf', s.toString(), '| kUSD balance after', (await erc.balanceOf(w.address)).toString());
save(`vault-save-${name}`, { name, amount: amt.toString(), txs: out, savingsOf: s.toString() });
process.exit(0);
