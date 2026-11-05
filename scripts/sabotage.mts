#!/usr/bin/env -S npx tsx
// Fault switch proof. KEDGE_SABOTAGE=sort skips the sort/duplicate pre-flight and sends UNSORTED friends straight to the chain.
// Usage: KEDGE_SABOTAGE=sort npx tsx scripts/sabotage.mts   -> evidence/campaign/SABOTAGE_sort.json
import { JsonRpcProvider, Wallet, formatEther } from 'ethers';
import { writeFileSync, readFileSync } from 'node:fs';
import { NET } from '../packages/kedge-kit/src/constants';
import { twinOf } from '../packages/kedge-kit/src/twin';
import { sendRuntimeCall, resolveOutcome, errorNameFromMessage } from '../packages/kedge-kit/src/helm';
import { api, closeApi } from '../packages/kedge-kit/src/purser';
import { checkGroups } from '../packages/kedge-kit/src/mate';
import * as S from '../watch/scale.mjs';
if (process.env.KEDGE_SABOTAGE !== 'sort') { console.error('Set KEDGE_SABOTAGE=sort'); process.exit(1); }
const provider = new JsonRpcProvider(NET.evmRpc, { chainId: NET.chainId, name: 'portaldot-v3' }, { staticNetwork: true });
const rpc = (m: string, p: unknown[]) => provider.send(m, p);
const key = (n: string) => JSON.parse(readFileSync(`keys/${n}.json`, 'utf8'));
const deployer = new Wallet(key('deployer').privateKey, provider); const lost = Wallet.createRandom().connect(provider);
const hx = (h: string) => '0x' + Buffer.from(twinOf(h)).toString('hex');
await (await deployer.sendTransaction({ to: lost.address, value: 1_000_000_000_000_000_000n, gasLimit: 6_000_000_000_000n, gasPrice: (await provider.getFeeData()).gasPrice! })).wait();
const a = await api();
const a1 = new Uint8Array(32).fill(0xaa), a2 = new Uint8Array(32).fill(0x11), a3 = new Uint8Array(32).fill(0x55); // deliberately NOT sorted
const spec = { friends: [a1, a2, a3], friendsNeeded: 2, inheritor32: twinOf(key('lifeboat').h160), inheritanceDelay: 10, priority: 1, cancelDelay: 2 };
let mateWithSabotage = 'passed (sabotage skipped the check)'; try { checkGroups(twinOf(lost.address), [spec]); } catch (e: any) { mateWithSabotage = `refused ${e.code}`; }
const callHex = S.setFriendGroups([{ friends: [a1, a2, a3].map((x) => '0x' + Buffer.from(x).toString('hex')), friendsNeeded: 2, inheritor: hx(key('lifeboat').h160), inheritanceDelay: 10, inheritancePriority: 1, cancelDelay: 2 }]);
let preflight: string | null = null; try { await rpc('eth_estimateGas', [{ from: lost.address, to: '0x6d6f646c70792f70616464720000000000000000', data: callHex }]); } catch (e: any) { preflight = errorNameFromMessage(String(e?.info?.error?.message ?? e)); }
const eth = { request: async ({ params }: any) => (await lost.sendTransaction({ to: params[0].to, data: params[0].data, gasLimit: params[0].gas, gasPrice: params[0].gasPrice, value: 0n })).hash };
const hash = await sendRuntimeCall(eth, rpc, lost.address, callHex, () => {}, { forceGas: '0x' + (30_000_000_000_000n).toString(16) });
const out = await resolveOutcome(a, rpc, hash);
const rec = { id: 'SABOTAGE_sort', command: 'KEDGE_SABOTAGE=sort npx tsx scripts/sabotage.mts', check: 'Mate sort and duplicate check skipped', mateWithSabotage, nodePreflightError: preflight,
  chain: { ethHash: hash, block: out.block, explorer: out.explorer, receiptStatus: out.receiptStatus, error: out.errorName }, pass: out.errorName === 'recovery.FriendsNotSortedOrUnique', at: new Date().toISOString() };
writeFileSync('evidence/campaign/SABOTAGE_sort.json', JSON.stringify(rec, null, 2) + '\n'); console.log(JSON.stringify(rec, null, 1)); await closeApi(); process.exit(0);
