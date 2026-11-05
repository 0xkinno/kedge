#!/usr/bin/env -S npx tsx
// Live proof for the ink! contract: a full Kedge rescue that sweeps tPOT, kUSD and savings held in the ink! (WASM) AllotmentInk.
// Writes evidence/ink/rescue.json. Funds come from the deployer; crew keys are the house drill keys in keys/.
import { JsonRpcProvider, Wallet, formatEther } from 'ethers';
import { u8aToHex } from '@polkadot/util';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { NET, PALLETS_ADDRESS, KUSD_ASSET_ID, INK_CONTRACT_ID, INK_CONTRACT_SS58, INK_SELECTORS, explorerBlock } from '../packages/kedge-kit/src/constants';
import { twinOf } from '../packages/kedge-kit/src/twin';
import * as P from '../packages/kedge-kit/src/purser';
import { sendRuntimeCall, resolveOutcome } from '../packages/kedge-kit/src/helm';
import { attempts, delayClock } from '../packages/kedge-kit/src/lookout';
import { inventory, plan, inkSavingsOf } from '../packages/kedge-kit/src/survey';

const provider = new JsonRpcProvider(NET.evmRpc, { chainId: NET.chainId, name: 'portaldot-v3' }, { staticNetwork: true });
const rpc = (m: string, p: unknown[]) => provider.send(m, p);
const key = (n: string) => JSON.parse(readFileSync(`keys/${n}.json`, 'utf8'));
const w = (n: string) => new Wallet(key(n).privateKey, provider);
const api = await P.api(); const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const hex32 = (a: Uint8Array) => u8aToHex(a); const PLANCK = 10n ** 14n;
const steps: any[] = [];
async function send(label: string, signer: Wallet, callHex: string) {
  const eth = { request: async ({ params }: any) => (await signer.sendTransaction({ to: params[0].to, data: params[0].data, gasLimit: params[0].gas, gasPrice: params[0].gasPrice, value: 0n })).hash };
  const hash = await sendRuntimeCall(eth as any, rpc, signer.address, callHex, () => {}); const out = await resolveOutcome(api, rpc, hash, 120_000);
  if (out.extrinsicFailed) throw new Error(`${label}: the chain refused: ${out.errorName}`);
  steps.push({ label, signer: signer.address, hash, block: out.block, explorer: explorerBlock(out.block), events: out.events.map((e: any) => e.event) });
  console.log(`  ${label}: ok (block ${out.block})`); return out;
}
const free = async (a32: Uint8Array) => ((await api.query.system.account(hex32(a32))) as any).data.free.toBigInt() as bigint;
const kusd = async (a32: Uint8Array) => { const r: any = await api.query.assets.account(KUSD_ASSET_ID, hex32(a32)); return r.isSome ? r.unwrap().balance.toBigInt() as bigint : 0n; };
const dryContract = async (origin32: Uint8Array, value: bigint, data: string) => (await api.call.contractsApi.call(hex32(origin32), INK_CONTRACT_ID, value, null, null, data)).toJSON() as any;

const deployer = w('deployer'); const lorna = w('drill-lorna'), ben = w('drill-ben'), boat = w('drill-lifeboat');
const lost = Wallet.createRandom().connect(provider); const lost32 = twinOf(lost.address); const dest32 = twinOf(boat.address);
console.log('lost wallet', lost.address, 'new phone', boat.address);
const gp = (await provider.getFeeData()).gasPrice!;
const f = await deployer.sendTransaction({ to: lost.address, value: 8n * 10n ** 18n, gasLimit: 6_000_000_000_000n, gasPrice: gp }); await f.wait();
await send('mint 25 kUSD to the old wallet', deployer, api.tx.assets.mint(KUSD_ASSET_ID, hex32(lost32), 25_000_000n).method.toHex());

// 1. the old wallet saves 3 tPOT into the ink! contract, signed from MetaMask through the pallets address
const SAVE = 3n * PLANCK;
const dsave = await dryContract(lost32, SAVE, INK_SELECTORS.save); if (!dsave.result?.ok) throw new Error('save dry run failed');
const w1 = dsave.gasRequired;
await send('save 3 tPOT into the ink! contract', lost, api.tx.contracts.call(INK_CONTRACT_SS58, SAVE, { refTime: BigInt(w1.refTime) * 12n / 10n, proofSize: BigInt(w1.proofSize) * 12n / 10n }, null, INK_SELECTORS.save).method.toHex());
const savedBefore = await inkSavingsOf(api, lost32);
if (savedBefore !== SAVE) throw new Error(`ink savings are ${savedBefore}, expected ${SAVE}`);
console.log('  ink savings of the old wallet:', formatEther(savedBefore * 10_000n), 'tPOT');

// 2. a stranger cannot pull it out: the contract reverts the call in a dry run
const stranger = w('stranger'); const dstr = await dryContract(twinOf(stranger.address), 0n, INK_SELECTORS.withdrawAllTo + Buffer.from(twinOf(stranger.address)).toString('hex'));
const strangerReverted = !!(Number(dstr.result?.ok?.flags?.bits ?? dstr.result?.ok?.flags ?? 0) & 1);
console.log('  stranger withdraw reverts:', strangerReverted);

// 3. Recovery: crew named, attempt started and approved, delay passes, new phone becomes the inheritor
await send('Ramon names his crew', lost, await P.setFriendGroups([{ friends: [twinOf(lorna.address), twinOf(ben.address)], friendsNeeded: 2, inheritor32: dest32, inheritanceDelay: 10, priority: 1, cancelDelay: 2 }]));
await send('Lorna starts the attempt', lorna, await P.initiate(lost32, 0));
await send('Ben approves', ben, await P.approve(lost32, 0));
const at = (await attempts(api, lost32))[0];
for (;;) { const head = (await api.rpc.chain.getHeader()).number.toNumber(); if (delayClock(at.initBlock, 10, head).finishable) break; await sleep(3000); }
await send('Finish: the new phone becomes the inheritor', boat, await P.finish(lost32, 0));

// 4. Surveyor plans, one signature brings everything home
const ethCall = (to: string, data: string) => provider.call({ to, data });
const inv = await inventory(api, lost32, lost.address, ethCall); const lines = await plan(api, lost32, dest32, boat.address, inv);
console.log(lines.map((l) => `${l.willMove ? 'WILL MOVE ' : 'will not  '}${l.label}`).join('\n'));
const items = lines.filter((l) => l.willMove).map((l) => l.item!);
const newBefore = await free(dest32);
const out = await send('Bring it home: one signature', boat, await P.bringHome(lost32, dest32, items));
const after = { oldTpot: await free(lost32), oldKusd: await kusd(lost32), oldInk: await inkSavingsOf(api, lost32), newKusd: await kusd(dest32), newTpotGain: (await free(dest32)) - newBefore };
const batch = (out as any).items; const inkCalled = out.events.some((e: any) => e.event === 'contracts.Called');
const pass = after.oldInk === 0n && after.oldKusd === 0n && after.oldTpot === 0n && inkCalled && strangerReverted && after.newKusd >= 25_000_000n;
const rec = { at: new Date().toISOString(), network: 'portaldot-v3 testnet', contract: INK_CONTRACT_SS58, lost: lost.address, newPhone: boat.address, saved: SAVE.toString(), strangerWithdrawReverts: strangerReverted,
  plan: lines.map(({ item, ...l }) => l), batchItems: batch, inkCalledEvent: inkCalled, after: Object.fromEntries(Object.entries(after).map(([k, v]) => [k, v.toString()])), steps, pass };
mkdirSync('evidence/ink', { recursive: true }); writeFileSync('evidence/ink/rescue.json', JSON.stringify(rec, null, 2) + '\n');
console.log(JSON.stringify({ pass, after: rec.after, batch, inkCalled }, null, 1));
await P.closeApi(); process.exit(pass ? 0 : 1);
