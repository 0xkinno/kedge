import { connect, evm } from './lib.mjs';
import { keccak256 } from 'ethers';
const api = await connect(); const p = evm(); const n = Number(process.argv[2]);
const bh = await api.rpc.chain.getBlockHash(n); const [blk, evs] = await Promise.all([api.rpc.chain.getBlock(bh), api.query.system.events.at(bh)]);
blk.block.extrinsics.forEach((xt, i) => { if (xt.method.section !== 'revive') return; const h = keccak256(xt.method.args[0].toU8a(true));
  console.log('ext', i, xt.method.section + '.' + xt.method.method, 'ethHash', h);
  for (const e of evs) if (e.phase.isApplyExtrinsic && e.phase.asApplyExtrinsic.toNumber() === i) console.log('   ', e.event.section + '.' + e.event.method, JSON.stringify(e.event.data.toHuman()).slice(0, 220)); });
const logs = await p.send('eth_getBlockByNumber', ['0x' + n.toString(16), true]);
for (const t of logs.transactions) { const r = await p.send('eth_getTransactionReceipt', [t.hash]); console.log('eth tx', t.hash.slice(0, 12), 'receipt status', r.status, 'gasUsed', r.gasUsed); }
await api.disconnect(); process.exit(0);
