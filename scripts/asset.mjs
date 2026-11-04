#!/usr/bin/env node
// Create the Kedge native test asset (kUSD) and mint to a recipient. Signed by the deployer EOA through the pallets address.
// pUSD (7777) cannot be used: its tPOT pool holds about 127 pUSD, so 200 pUSD cannot be bought at any price.
import { connect, evm, wallet, loadKey, sendRuntime, save, KUSD_ID } from './lib.mjs';

const api = await connect(); const p = evm(); const w = wallet('deployer', p);
const exists = (await api.query.assets.asset(KUSD_ID)).isSome;
const admin = loadKey('deployer').twinSs58; const to = loadKey(process.argv[2] ?? 'ramon'); const amount = BigInt(process.argv[3] ?? 1000) * 10n ** 6n;
const calls = [];
if (!exists) { calls.push(api.tx.assets.create(KUSD_ID, admin, 1), api.tx.assets.setMetadata(KUSD_ID, 'Kedge test dollar', 'kUSD', 6)); }
calls.push(api.tx.assets.mint(KUSD_ID, to.twinSs58, amount));
const r = await sendRuntime(api, w, api.tx.utility.batchAll(calls).method.toHex());
const bal = (await api.query.assets.account(KUSD_ID, to.twinSs58)).unwrap().balance.toString();
console.log('asset', KUSD_ID, exists ? 'existed' : 'created', 'minted to', process.argv[2] ?? 'ramon', 'tx', r.hash, 'block', r.outcome.block, 'balance', bal);
console.log(r.outcome.events.map((e) => e.error ? `${e.event}:${e.error}` : e.event).join(' '));
save('asset', { id: KUSD_ID, tx: r.hash, block: r.outcome.block, recipient: to.h160, balance: bal });
await api.disconnect(); process.exit(0);
