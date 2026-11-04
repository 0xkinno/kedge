#!/usr/bin/env node
// Live cost estimates for the funding list. Read-only. Costs in tPOT (18-decimal EVM view) from eth_estimateGas * gasPrice.
import { evm, loadKey, PALLETS, connect, save } from './lib.mjs';
import { readFileSync } from 'node:fs';
import { AbiCoder, Interface, formatEther } from 'ethers';
const p = evm(); const from = loadKey('deployer').h160;
const price = (await p.getFeeData()).gasPrice;
const est = async (label, tx) => { try { const g = await p.estimateGas({ from, ...tx }); return { label, gas: g.toString(), tPOT: formatEther(g * price) }; } catch (e) { return { label, error: String(e.shortMessage ?? e.message).slice(0, 200) }; } };
const vault = JSON.parse(readFileSync('contracts/artifacts/AllotmentVault.json', 'utf8'));
const caller = JSON.parse(readFileSync('contracts/artifacts/Caller.json', 'utf8'));
const pusdPrecompile = '0x' + (7777).toString(16).padStart(8, '0') + '0'.repeat(24) + '00010000';
const ctor = AbiCoder.defaultAbiCoder().encode(['address'], [pusdPrecompile]).slice(2);
const api = await connect();
const remark = api.tx.system.remarkWithEvent('0x6b65646765').method.toHex();
const out = [
  await est('plain value transfer', { to: loadKey('ramon').h160, value: 1n }),
  await est('remark_with_event via pallets address', { to: PALLETS, data: remark }),
  await est('deploy AllotmentVault', { data: vault.bytecode + ctor }),
  await est('deploy Caller', { data: caller.bytecode }),
];
const dep = (await api.query.system.account(loadKey('deployer').twinSs58)).data.free.toString();
console.log(JSON.stringify({ gasPriceWei: price.toString(), pusdPrecompile, deployerFreePlanck: dep, estimates: out }, null, 1));
save('estimates', { gasPriceWei: price.toString(), estimates: out });
await api.disconnect(); process.exit(0);
