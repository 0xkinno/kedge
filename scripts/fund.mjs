#!/usr/bin/env node
// Spread tPOT from the deployer to the cast. Amounts in tPOT. Native 5... targets use balances.transfer_keep_alive
// dispatched through the pallets address; EVM targets use a plain value transfer. Prints hashes only.
import { evm, wallet, loadKey, connect, PALLETS, save, sleep } from './lib.mjs';
import { parseEther, formatEther } from 'ethers';
const PLAN = JSON.parse(process.argv[2] ?? '{}');
const p = evm(); const w = wallet('deployer', p); const api = await connect();
const price = (await p.getFeeData()).gasPrice; const done = [];
for (const [name, tpot] of Object.entries(PLAN)) {
  const k = loadKey(name); let tx;
  if (k.h160) { // EVM target: value transfer
    const gas = await p.estimateGas({ from: w.address, to: k.h160, value: parseEther(String(tpot)) });
    tx = await w.sendTransaction({ to: k.h160, value: parseEther(String(tpot)), gasLimit: gas * 12n / 10n, gasPrice: price });
  } else { // native target via pallets address
    const data = api.tx.balances.transferKeepAlive(k.ss58, BigInt(tpot) * 10n ** 14n).method.toHex();
    const gas = await p.estimateGas({ from: w.address, to: PALLETS, data });
    tx = await w.sendTransaction({ to: PALLETS, data, gasLimit: gas * 12n / 10n, gasPrice: price });
  }
  const r = await tx.wait();
  const addr = k.twinSs58 ?? k.ss58; const bal = (await api.query.system.account(addr)).data.free.toBigInt();
  console.log(name, tpot, 'tPOT', tx.hash, 'status', r.status, 'block', r.blockNumber, 'now', Number(bal) / 1e14);
  done.push({ name, tpot, hash: tx.hash, block: r.blockNumber, status: r.status });
}
save('funding', { plan: PLAN, done });
await api.disconnect(); process.exit(0);
