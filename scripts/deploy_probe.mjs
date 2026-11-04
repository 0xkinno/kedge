#!/usr/bin/env node
// Deploy throwaway PROBE contracts from the deployer. Not the vault (deploy.mjs, which asks first).
import { evm, wallet, save } from './lib.mjs';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { ContractFactory, formatEther } from 'ethers';
const p = evm(); const w = wallet('deployer', p); const file = 'deployments/probes.json';
const rec = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
for (const name of process.argv.slice(2)) {
  if (rec[name]) { console.log(name, 'already deployed at', rec[name].address); continue; }
  const art = JSON.parse(readFileSync(`contracts/artifacts/${name}.json`, 'utf8'));
  const f = new ContractFactory(art.abi, art.bytecode, w);
  const dtx = await f.getDeployTransaction(); const gas = await p.estimateGas({ from: w.address, data: dtx.data }); const price = (await p.getFeeData()).gasPrice;
  const before = await p.getBalance(w.address);
  const c = await f.deploy({ gasLimit: gas * 13n / 10n, gasPrice: price }); const r = await c.deploymentTransaction().wait();
  const code = await p.getCode(r.contractAddress);
  const ok = code.toLowerCase() === art.deployedBytecode.toLowerCase();
  const cost = formatEther(before - await p.getBalance(w.address));
  rec[name] = { address: r.contractAddress, txHash: r.hash, block: r.blockNumber, costTPOT: cost, runtimeBytecodeMatchesArtifact: ok };
  console.log(name, r.contractAddress, 'tx', r.hash, 'block', r.blockNumber, 'cost', cost, 'tPOT', 'bytecode match', ok);
  writeFileSync(file, JSON.stringify(rec, null, 2) + '\n');
}
process.exit(0);
