#!/usr/bin/env node
// Deploy AllotmentVault from the deployer. Prints the estimated tPOT cost first (Kinnoski approved 92.4 tPOT estimate,
// 2026-11-04). Verifies deployed runtime bytecode equals the artifact (immutable slots patched) and writes deployments/testnet.json.
import { evm, wallet, KUSD_ID, assetPrecompile, NET } from './lib.mjs';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { ContractFactory, formatEther, AbiCoder } from 'ethers';
const OUT = 'deployments/testnet.json';
if (existsSync(OUT) && JSON.parse(readFileSync(OUT, 'utf8')).AllotmentVault) { console.log('already deployed:', JSON.parse(readFileSync(OUT, 'utf8')).AllotmentVault.address); process.exit(0); }
const p = evm(); const w = wallet('deployer', p);
const art = JSON.parse(readFileSync('contracts/artifacts/AllotmentVault.json', 'utf8'));
const token = assetPrecompile(KUSD_ID);
const f = new ContractFactory(art.abi, art.bytecode, w);
const dtx = await f.getDeployTransaction(token); const gas = await p.estimateGas({ from: w.address, data: dtx.data }); const price = (await p.getFeeData()).gasPrice;
console.log('estimated cost', formatEther(gas * price), 'tPOT; token precompile', token);
const before = await p.getBalance(w.address);
const c = await f.deploy(token, { gasLimit: gas * 13n / 10n, gasPrice: price }); const r = await c.deploymentTransaction().wait();
let expected = art.deployedBytecode.slice(2);
const word = AbiCoder.defaultAbiCoder().encode(['address'], [token]).slice(2);
for (const refs of Object.values(art.immutableReferences)) for (const { start, length } of refs) expected = expected.slice(0, start * 2) + word.slice(64 - length * 2) + expected.slice((start + length) * 2);
const onchain = (await p.getCode(r.contractAddress)).slice(2);
const match = onchain.toLowerCase() === expected.toLowerCase();
const rec = { AllotmentVault: { address: r.contractAddress, txHash: r.hash, block: r.blockNumber, token, tokenAssetId: KUSD_ID, costTPOT: formatEther(before - await p.getBalance(w.address)),
  runtimeBytecodeMatchesArtifact: match, solc: art.solc, evmVersion: art.evmVersion, deployer: w.address, explorer: `${NET.explorer}/#/blocks/${r.blockNumber}?tab=events`, deployedAt: new Date().toISOString() } };
writeFileSync(OUT, JSON.stringify(rec, null, 2) + '\n');
console.log(JSON.stringify(rec.AllotmentVault, null, 1));
if (!match) { console.error('BYTECODE MISMATCH'); process.exit(1); }
process.exit(0);
