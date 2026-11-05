#!/usr/bin/env -S npx tsx
// Proof and break campaign. Usage: npx tsx scripts/campaign.mts [H1 H2 ATTACK PRIORITY SWEEP MISC COUNTER]
// Every scenario runs on the live V3 testnet and writes evidence/campaign/<id>.json. Refusals are sent ON CHAIN.
import { JsonRpcProvider, Wallet, Contract, Interface, formatEther, hexlify, getBytes } from 'ethers';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady, decodeAddress } from '@polkadot/util-crypto';
import { u8aToHex } from '@polkadot/util';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { NET, PALLETS_ADDRESS, KUSD_ASSET_ID, assetPrecompile, VAULT_ADDRESS, explorerBlock } from '../packages/kedge-kit/src/constants';
import { twinOf } from '../packages/kedge-kit/src/twin';
import * as P from '../packages/kedge-kit/src/purser';
import { sendRuntimeCall, resolveOutcome, errorNameFromMessage, type Outcome } from '../packages/kedge-kit/src/helm';
import { attempts, friendGroups, inheritor, delayClock } from '../packages/kedge-kit/src/lookout';
import { inventory, plan } from '../packages/kedge-kit/src/survey';
import { checkGroups, refuseContractInheritor, KedgeRefusal } from '../packages/kedge-kit/src/mate';
import { callPhrase, phraseMatches } from '../packages/kedge-kit/src/phrase';

const provider = new JsonRpcProvider(NET.evmRpc, { chainId: NET.chainId, name: 'portaldot-v3' }, { staticNetwork: true });
const rpc = (m: string, p: unknown[]) => provider.send(m, p);
const key = (n: string) => JSON.parse(readFileSync(`keys/${n}.json`, 'utf8'));
const w = (n: string) => new Wallet(key(n).privateKey, provider);
const api = await P.api();
await cryptoWaitReady();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const FORCE_GAS = '0x' + (30_000_000_000_000n).toString(16);

type Tx = { label: string; signer: string; hash: string; block: number; explorer: string; ok: boolean; error?: string; fee: string; events: string[]; preflightRefusal?: string; extra?: any };
const feeOf = (o: Outcome) => o.events.filter((e) => e.event === 'transactionPayment.TransactionFeePaid').reduce((s, e) => s + BigInt(String(e.data.actualFee).replace(/,/g, '')), 0n);
const names = (o: Outcome) => o.events.map((e) => (e.error ? `${e.event}:${e.error}` : e.event));

async function send(txs: Tx[], label: string, signer: Wallet, callHex: string, { expectFail = false } = {}): Promise<{ tx: Tx; out: Outcome }> {
  const eth = { request: async ({ params }: any) => { const t = params[0]; return (await signer.sendTransaction({ to: t.to, data: t.data, gasLimit: t.gas, gasPrice: t.gasPrice, value: 0n })).hash; } };
  let preflight: string | undefined;
  if (expectFail) { try { await rpc('eth_estimateGas', [{ from: signer.address, to: PALLETS_ADDRESS, data: callHex }]); } catch (e: any) { preflight = errorNameFromMessage(String(e?.info?.error?.message ?? e?.message ?? e)) ?? 'DISPATCH_FAILED'; } }
  const hash = await sendRuntimeCall(eth as any, rpc, signer.address, callHex, () => {}, expectFail ? { forceGas: FORCE_GAS } : {});
  const out = await resolveOutcome(api, rpc, hash);
  const tx: Tx = { label, signer: signer.address, hash, block: out.block, explorer: out.explorer, ok: !out.extrinsicFailed, error: out.errorName, fee: formatEther(feeOf(out) * 10_000n), events: names(out), preflightRefusal: preflight };
  txs.push(tx); console.log(`  ${label}: ${tx.ok ? 'ok' : 'FAILED ' + tx.error} (block ${tx.block})`);
  return { tx, out };
}
async function sendNative(txs: Tx[], label: string, pair: any, extrinsic: any): Promise<Tx> {
  const res: any = await new Promise((resolve, reject) => { extrinsic.signAndSend(pair, (r: any) => { if (r.status.isInBlock) resolve(r); }).catch(reject); });
  const evs = res.events.map((e: any) => `${e.event.section}.${e.event.method}`);
  const failed = res.events.find((e: any) => e.event.section === 'system' && e.event.method === 'ExtrinsicFailed');
  const n = (await api.rpc.chain.getHeader(res.status.asInBlock)).number.toNumber();
  const tx: Tx = { label, signer: pair.address, hash: res.txHash.toHex(), block: n, explorer: explorerBlock(n), ok: !failed, fee: '', events: evs };
  txs.push(tx); console.log(`  ${label} (native sr25519): ${tx.ok ? 'ok' : 'FAILED'} (block ${n})`); return tx;
}
const evidence = (id: string, o: object) => { mkdirSync('evidence/campaign', { recursive: true });
  writeFileSync(`evidence/campaign/${id}.json`, JSON.stringify({ id, at: new Date().toISOString(), network: 'portaldot-v3 testnet', ...o }, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2) + '\n'); };

// ---- accounts and funding
const deployer = w('deployer'); const price = async () => (await provider.getFeeData()).gasPrice!;
async function fund(h160: string, tpot: number) { const t = await deployer.sendTransaction({ to: h160, value: BigInt(Math.round(tpot * 1e6)) * 10n ** 12n, gasLimit: 6_000_000_000_000n, gasPrice: await price() }); await t.wait(); }
async function mintKusd(h160: string, amount: bigint) { const t: Tx[] = [];
  await send(t, 'mint kUSD', deployer, (await api).tx.assets.mint(KUSD_ASSET_ID, u8aToHex(twinOf(h160)), amount).method.toHex()); }
const freeOf = async (a32: Uint8Array) => ((await api.query.system.account(u8aToHex(a32))) as any).data.free.toBigInt() as bigint;
const kusdOf = async (a32: Uint8Array) => { const r: any = await api.query.assets.account(KUSD_ASSET_ID, u8aToHex(a32)); return r.isSome ? r.unwrap().balance.toBigInt() as bigint : 0n; };
const vaultIface = new Interface(JSON.parse(readFileSync('contracts/artifacts/AllotmentVault.json', 'utf8')).abi);
const ethCall = (to: string, data: string) => provider.call({ to, data });
const savingsOf = async (h: string) => BigInt(await ethCall(VAULT_ADDRESS, vaultIface.encodeFunctionData('savingsOf', [h])));
async function vaultSave(who: Wallet, amount: bigint, txs: Tx[]) {
  const erc = new Contract(assetPrecompile(KUSD_ASSET_ID), ['function approve(address,uint256) returns (bool)'], who);
  const vault = new Contract(VAULT_ADDRESS, vaultIface, who); const gp = await price();
  const g1 = await erc.approve.estimateGas(VAULT_ADDRESS, amount); const a = await erc.approve(VAULT_ADDRESS, amount, { gasLimit: g1 * 13n / 10n, gasPrice: gp }); const ra = await a.wait();
  const g2 = await vault.save.estimateGas(amount); const s = await vault.save(amount, { gasLimit: g2 * 13n / 10n, gasPrice: gp }); const rs = await s.wait();
  txs.push({ label: 'approve kUSD (ERC-20 precompile)', signer: who.address, hash: a.hash, block: ra!.blockNumber, explorer: explorerBlock(ra!.blockNumber), ok: ra!.status === 1, fee: '', events: [] });
  txs.push({ label: 'save into AllotmentVault', signer: who.address, hash: s.hash, block: rs!.blockNumber, explorer: explorerBlock(rs!.blockNumber), ok: rs!.status === 1, fee: '', events: [] });
}
const grp = (heir: Uint8Array, friends: Uint8Array[], need: number, delay: number, prio: number, cancel = 2) => ({ friends, friendsNeeded: need, inheritor32: heir, inheritanceDelay: delay, priority: prio, cancelDelay: cancel });
const T = (n: string) => twinOf(key(n).h160);
async function waitFinishable(lost: Uint8Array, gi: number, delay: number) {
  const at = (await attempts(api, lost)).find((x) => x.groupIndex === gi)!; const t0 = Date.now();
  for (;;) { const head = (await api.rpc.chain.getHeader()).number.toNumber(); if (delayClock(at.initBlock, delay, head).finishable) return { initBlock: at.initBlock, waitedSeconds: (Date.now() - t0) / 1000 }; await sleep(3000); }
}
const newAccount = () => Wallet.createRandom().connect(provider);
const totalFee = (txs: Tx[]) => txs.reduce((s, t) => s + (t.fee ? Number(t.fee) : 0), 0);

// ---- shared: set groups with Mate checks, initiate, approve, wait, finish
async function rescueUntilFinished(txs: Tx[], lost: Wallet, groups: ReturnType<typeof grp>[], gi: number, initiator: Wallet, approvers: Wallet[], opts: { setGroups?: boolean } = {}) {
  const lost32 = twinOf(lost.address);
  if (opts.setGroups !== false) { checkGroups(lost32, groups); await refuseContractInheritor(groups[gi].inheritor32, (a) => provider.getCode(a)); await send(txs, 'set_friend_groups', lost, await P.setFriendGroups(groups)); }
  await send(txs, 'initiate_attempt', initiator, await P.initiate(lost32, gi));
  for (const a of approvers) await send(txs, 'approve_attempt', a, await P.approve(lost32, gi));
  const waited = await waitFinishable(lost32, gi, groups[gi].inheritanceDelay);
  return waited;
}

const want = new Set(process.argv.slice(2).length ? process.argv.slice(2) : ['H1', 'H2', 'ATTACK', 'PRIORITY', 'SWEEP', 'MISC', 'COUNTER']);
const CREW = ['lorna', 'ben', 'ana'];
let L1: Wallet | null = null;
const state: any = (() => { try { return JSON.parse(readFileSync('evidence/campaign/_state.json', 'utf8')); } catch { return {}; } })();
const saveState = () => writeFileSync('evidence/campaign/_state.json', JSON.stringify(state, null, 1));

// ================= H1 =================
if (want.has('H1')) {
  console.log('H1 happy path'); const txs: Tx[] = [];
  const lost = newAccount(); const lost32 = twinOf(lost.address); const heir = w('lifeboat'); const heir32 = twinOf(heir.address);
  await fund(lost.address, 14); await mintKusd(lost.address, 150_000_000n);
  await vaultSave(lost, 100_000_000n, txs);
  const before = { tpot: await freeOf(lost32), kusd: await kusdOf(lost32), vault: await savingsOf(lost.address), heirKusd: await kusdOf(heir32), heirTpot: await freeOf(heir32) };
  const group = grp(heir32, CREW.map(T), 2, 10, 1);
  const waited = await rescueUntilFinished(txs, lost, [group], 0, w('lorna'), [w('ben')]);
  await send(txs, 'finish_attempt', heir, await P.finish(lost32, 0));
  const inv = await inventory(api, lost32, lost.address, ethCall); const lines = await plan(api, lost32, heir32, heir.address, inv);
  const items = lines.filter((l) => l.willMove).map((l) => l.item!);
  const { tx: ctl, out } = await send(txs, 'control_inherited_account(force_batch[vault.withdrawAllTo, assets.transfer, balances.transfer_all])', heir, await P.bringHome(lost32, heir32, items));
  const logs = await provider.getLogs({ address: VAULT_ADDRESS, fromBlock: ctl.block, toBlock: ctl.block });
  const withdrawn = logs.map((l) => { try { return vaultIface.parseLog(l); } catch { return null; } }).find((l) => l?.name === 'Withdrawn');
  const after = { tpot: await freeOf(lost32), kusd: await kusdOf(lost32), vault: await savingsOf(lost.address), heirKusd: await kusdOf(heir32), heirTpot: await freeOf(heir32) };
  const completed = out.items.filter((i) => i.status === 'completed').length, failed = out.items.filter((i) => i.status === 'failed').length;
  const pass = completed === 3 && failed === 0 && out.controlResult === 'Ok' && withdrawn?.args.saver.toLowerCase() === lost.address.toLowerCase() && after.vault === 0n && after.kusd === 0n && after.heirKusd - before.heirKusd === 150_000_000n;
  state.L1 = { address: lost.address, heir: 'lifeboat' }; saveState();
  evidence('H1', { title: 'Happy path: setup, initiate, approve, wait, finish, bring home (tPOT + kUSD + vault)', expected: 'all items ItemCompleted; balances moved to the new key; vault Withdrawn(saver = old address)',
    pass, lost: lost.address, lostTwin: twinOf(lost.address) && u8aToHex(lost32), inheritor: heir.address, surveyPlan: lines.map(({ item, ...l }) => l), before, after,
    delta: { heirKusd: (after.heirKusd - before.heirKusd).toString(), heirTpot: formatEther((after.heirTpot - before.heirTpot) * 10_000n) },
    storageDepositRefundTPOT: formatEther((after.heirTpot - before.heirTpot - before.tpot) * 10_000n + feeOf(out) * 10_000n),
    storageDepositRefundNote: 'heir tPOT gained minus the old account tPOT before, plus the control fee. A positive number means the vault slot deposit came back during the sweep.',
    items: out.items, controlResult: out.controlResult, vaultWithdrawnSaver: withdrawn?.args.saver, delaySeconds: waited.waitedSeconds, totalFeesTPOT: totalFee(txs), txs });
  console.log('H1', pass ? 'PASS' : 'FAIL', JSON.stringify({ completed, failed, controlResult: out.controlResult }));
}

// ================= H2: one guardian on SubWallet-style sr25519 =================
if (want.has('H2')) {
  console.log('H2 cross-VM guardians'); const txs: Tx[] = [];
  const lost = newAccount(); const lost32 = twinOf(lost.address); const heir = w('lifeboat'); const heir32 = twinOf(heir.address);
  const sr = new Keyring({ type: 'sr25519', ss58Format: 42 }).addFromMnemonic(key('sr-guardian').mnemonic); const sr32 = decodeAddress(sr.address);
  await fund(lost.address, 6); await mintKusd(lost.address, 40_000_000n);
  const before = { kusd: await kusdOf(heir32), tpot: await freeOf(heir32) };
  const group = grp(heir32, [sr32, T('lorna'), T('ben')], 2, 8, 1);
  checkGroups(lost32, [group]);
  await send(txs, 'set_friend_groups', lost, await P.setFriendGroups([group]));
  await send(txs, 'initiate_attempt (lorna, MetaMask)', w('lorna'), await P.initiate(lost32, 0));
  await sendNative(txs, 'approve_attempt (sr25519 guardian, native extrinsic)', sr, api.tx.recovery.approveAttempt({ Id: u8aToHex(lost32) }, 0));
  await waitFinishable(lost32, 0, 8);
  await send(txs, 'finish_attempt', heir, await P.finish(lost32, 0));
  const inv = await inventory(api, lost32, lost.address, ethCall); const lines = await plan(api, lost32, heir32, heir.address, inv);
  const items = lines.filter((l) => l.willMove).map((l) => (l.item!.kind === 'native' ? { kind: 'native' as const, keepAlive: true } : l.item!));
  const { out } = await send(txs, 'control_inherited_account(force_batch[assets.transfer, balances.transfer_all keep_alive=true])', heir, await P.bringHome(lost32, heir32, items));
  const leftOnOld = await freeOf(lost32);
  const pass = out.items.every((i) => i.status === 'completed') && out.controlResult === 'Ok' && (await kusdOf(heir32)) - before.kusd === 40_000_000n;
  evidence('H2', { title: 'Cross-VM guardians: one sr25519 guardian approves with a native extrinsic, two on MetaMask', expected: 'completes', pass,
    items: out.items, controlResult: out.controlResult, q6_transferAll_keepAlive_true_leftOnOldAccountPlanck: leftOnOld.toString(), q6_note: 'keep_alive=true leaves the existential deposit (0.1 tPOT = 10^13 planck) on the old account; H1 used false and left 0', txs });
  console.log('H2', pass ? 'PASS' : 'FAIL', 'left on old account (planck):', leftOnOld.toString());
}

// ================= ATTACK: A1 to A6 on one target =================
if (want.has('ATTACK')) {
  console.log('A1-A6 attacks'); const txs: Tx[] = []; const tag = (t: Tx) => t;
  const lost = newAccount(); const lost32 = twinOf(lost.address); const heir32 = T('lifeboat'); await fund(lost.address, 3);
  const group = grp(heir32, CREW.map(T), 2, 12, 1, 2);
  await send(txs, 'set_friend_groups', lost, await P.setFriendGroups([group]));
  const res: Record<string, any> = {};
  const rec = (id: string, expected: string, t: Tx, extra: object = {}) => { res[id] = { id, expected, observedError: t.error ?? null, pass: !t.ok && t.error === expected, tx: t, ...extra }; };
  const A1 = await send(txs, 'A1 stranger initiate_attempt', w('stranger'), await P.initiate(lost32, 0), { expectFail: true }); rec('A1', 'recovery.NotFriend', A1.tx);
  await send(txs, 'lorna initiate_attempt (legitimate)', w('lorna'), await P.initiate(lost32, 0));
  const A2 = await send(txs, 'A2 finish with 1 of 2 approvals', w('lifeboat'), await P.finish(lost32, 0), { expectFail: true }); rec('A2', 'recovery.NotApproved', A2.tx);
  await send(txs, 'ben approve_attempt (legitimate)', w('ben'), await P.approve(lost32, 0));
  const A4 = await send(txs, 'A4 ben approves twice', w('ben'), await P.approve(lost32, 0), { expectFail: true }); rec('A4', 'recovery.AlreadyApproved', A4.tx, { predictedError: 'recovery.AlreadyVoted', predictionMatched: A4.tx.error === 'recovery.AlreadyVoted', note: 'The build instruction predicted AlreadyVoted. V3 refuses a repeat approval from the same guardian with AlreadyApproved. The refusal held; the predicted name was wrong.' });
  const A3 = await send(txs, 'A3 finish before the delay', w('lifeboat'), await P.finish(lost32, 0), { expectFail: true }); rec('A3', 'recovery.NotYetInheritable', A3.tx);
  const A5 = await send(txs, 'A5 owner slash_attempt (owner still holds key)', lost, await P.slash(0));
  res.A5 = { id: 'A5', expected: 'AttemptSlashed', pass: A5.out.events.some((e) => e.event === 'recovery.AttemptSlashed'), tx: A5.tx, attemptsAfter: (await attempts(api, lost32)).length,
    note: 'SecurityDeposit is 0 on V3, so nothing is burned. The owner can still end an attempt he did not start.', slashEvent: A5.out.events.find((e) => e.event === 'recovery.AttemptSlashed')?.data };
  await send(txs, 'malicious initiate again (lorna)', w('lorna'), await P.initiate(lost32, 0));
  const A6 = await send(txs, 'A6 initiator tries cancel_attempt inside the cancel delay', w('lorna'), await P.cancel(lost32, 0), { expectFail: true }); rec('A6', 'recovery.NotYetCancelable', A6.tx);
  await sleep(20_000);
  const C = await send(txs, 'initiator cancel after the delay (legitimate)', w('lorna'), await P.cancel(lost32, 0));
  res.A6.cancelAfterDelay = { ok: C.tx.ok, events: C.tx.events };
  for (const [id, r] of Object.entries(res)) { const { id: _i, ...rest } = r as any; evidence(id, { title: id, ...rest, txs: [rest.tx] }); console.log(id, rest.pass ? 'PASS' : 'FAIL', rest.observedError ?? ''); }
  evidence('ATTACK_RUN', { title: 'A1 to A6 full transaction log', lost: lost.address, totalFeesTPOT: totalFee(txs), txs });
}

// ================= PRIORITY: A8, A9 =================
if (want.has('PRIORITY')) {
  console.log('A8/A9 priority'); const txs: Tx[] = [];
  const lost = newAccount(); const lost32 = twinOf(lost.address); await fund(lost.address, 6); await mintKusd(lost.address, 50_000_000n);
  const family = grp(T('drill-lifeboat'), [T('drill-lorna'), T('drill-ben')], 2, 10, 0, 2);
  const crew = grp(T('lifeboat'), CREW.map(T), 2, 5, 1, 2);
  checkGroups(lost32, [family, crew]);
  await send(txs, 'set_friend_groups [Family priority 0, Crew priority 1]', lost, await P.setFriendGroups([family, crew]));
  await send(txs, 'crew initiate', w('lorna'), await P.initiate(lost32, 1)); await send(txs, 'crew approve', w('ben'), await P.approve(lost32, 1));
  await waitFinishable(lost32, 1, 5); await send(txs, 'crew finish', w('lifeboat'), await P.finish(lost32, 1));
  const heir1 = await inheritor(api, lost32);
  await send(txs, 'family initiate', w('drill-lorna'), await P.initiate(lost32, 0)); await send(txs, 'family approve', w('drill-ben'), await P.approve(lost32, 0));
  await waitFinishable(lost32, 0, 10);
  const { tx: fin, out } = await send(txs, 'family finish (higher priority replaces the crew inheritor)', w('drill-lifeboat'), await P.finish(lost32, 0));
  const fe = out.events.find((e) => e.event === 'recovery.AttemptFinished');
  const heir2 = await inheritor(api, lost32);
  evidence('A8', { title: 'Priority override: Family (priority 0) finishes after Crew', expected: 'AttemptFinished { previous_inheritor = Crew inheritor }',
    pass: !!fe && JSON.stringify(fe.data).includes(key('lifeboat').twinSs58), finishedEvent: fe?.data, inheritorBefore: heir1, inheritorAfter: heir2, tx: fin, txs });
  console.log('A8', JSON.stringify(fe?.data));
  // A9: crew tries again after Family recovered
  const a9 = await send(txs, 'A9 crew initiate again after Family recovered', w('lorna'), await P.initiate(lost32, 1), { expectFail: true });
  let a9b = a9;
  if (a9.tx.ok) { await send(txs, 'A9 crew approve', w('ben'), await P.approve(lost32, 1)); await waitFinishable(lost32, 1, 5); a9b = await send(txs, 'A9 crew finish', w('lifeboat'), await P.finish(lost32, 1), { expectFail: true }); }
  evidence('A9', { title: 'Priority lock: Crew tries again after Family recovered', expected: 'recovery.HigherPriorityRecovered', pass: !a9b.tx.ok && a9b.tx.error === 'recovery.HigherPriorityRecovered', observedError: a9b.tx.error ?? null,
    initiateWasAlreadyRefused: !a9.tx.ok, tx: a9b.tx, txs: [a9.tx, a9b.tx] });
  console.log('A9', a9b.tx.error ?? 'no error');
  // A7 reuse: the family inheritor tries to reconfigure the old account through the inheritance
  const a7 = await send(txs, 'A7 inheritor control_inherited_account(recovery.set_friend_groups)', w('drill-lifeboat'),
    (await api).tx.recovery.controlInheritedAccount({ Id: u8aToHex(lost32) }, api.tx.recovery.setFriendGroups([])).method.toHex());
  evidence('A7', { title: 'Reentrancy guard: inheritor tries to rewrite recovery config through control_inherited_account', expected: 'receipt ok, RecoveredAccountControlled.call_result = Err',
    pass: a7.tx.ok && JSON.stringify(a7.out.controlResult).includes('Err'), receiptStatusOk: a7.tx.ok, controlResult: a7.out.controlResult, tx: a7.tx });
  console.log('A7', JSON.stringify(a7.out.controlResult));
  // A10: sweep with one item that must fail
  const bad = [{ kind: 'asset' as const, assetId: KUSD_ASSET_ID, amount: 999_000_000n }, { kind: 'native' as const, keepAlive: false }];
  const a10 = await send(txs, 'A10 force_batch [assets.transfer 999 kUSD (must fail), balances.transfer_all]', w('drill-lifeboat'), await P.bringHome(lost32, T('drill-lifeboat'), bad));
  const done = a10.out.items.filter((i) => i.status === 'completed').length, fail = a10.out.items.filter((i) => i.status === 'failed');
  evidence('A10', { title: 'Sweep with one item that must fail', expected: 'other items ItemCompleted, one ItemFailed', pass: done === 1 && fail.length === 1, items: a10.out.items, controlResult: a10.out.controlResult, tx: a10.tx });
  console.log('A10', JSON.stringify(a10.out.items));
  evidence('PRIORITY_RUN', { lost: lost.address, totalFeesTPOT: totalFee(txs), txs });
}

// ================= MISC: A7 on H1's account is covered above; A11, A12 =================
if (want.has('MISC')) {
  console.log('A11/A12'); 
  const probes = JSON.parse(readFileSync('deployments/probes.json', 'utf8')); const p8 = JSON.parse(readFileSync('evidence/probe/part8.json', 'utf8'));
  const contractTwin = twinOf(probes.Caller.address);
  let refusal: string | null = null; try { await refuseContractInheritor(contractTwin, (a) => provider.getCode(a)); } catch (e) { refusal = e instanceof KedgeRefusal ? e.code : String(e); }
  evidence('A11', { title: 'Contract set as inheritor', expected: 'refused by Mate; on-chain probe shows contract to pallets address is a no-op', pass: refusal === 'INHERITOR_IS_CONTRACT' && p8.remarkedEventSeen === false,
    contract: probes.Caller.address, mateRefusalCode: refusal, onChainProbe: { ethHash: p8.ethHash, block: p8.block, calledOk: p8.calledEvent, remarkedEventSeen: p8.remarkedEventSeen, explorer: explorerBlock(p8.block) } });
  console.log('A11', refusal);
  const lost = twinOf(w('ramon').address); const real = twinOf(w('lifeboat').address); const scam = twinOf(w('stranger').address);
  const shown = callPhrase(lost, real, 0); const scamShown = callPhrase(lost, scam, 0);
  evidence('A12', { title: 'Scam link with a different inheritor', expected: 'call phrase mismatch, approve disabled', pass: !phraseMatches(scamShown.join(' '), shown) && phraseMatches(shown.join(' '), shown),
    phraseFromRamonsNewPhone: shown, phraseOnScamLink: scamShown, approveEnabledWhenTypingScamWords: phraseMatches(scamShown.join(' '), shown), note: 'Advisory UI. The chain enforces threshold and delay.' });
  console.log('A12', shown.join(' '), 'vs', scamShown.join(' '));
}

// ================= COUNTER: C1, C2 =================
if (want.has('COUNTER')) {
  console.log('C1/C2 counterfactuals'); const txs: Tx[] = [];
  const lost = newAccount(); const lost32 = twinOf(lost.address); await fund(lost.address, 6); await mintKusd(lost.address, 30_000_000n); await vaultSave(lost, 10_000_000n, txs);
  const addr = lost.address; const mnemonicDiscarded = true; // the random key is never written to disk; it is dropped when this process ends
  const snap = { tpot: (await freeOf(lost32)).toString(), kusd: (await kusdOf(lost32)).toString(), vaultSavings: (await savingsOf(addr)).toString(), friendGroups: (await friendGroups(api, lost32)).length, inheritor: await inheritor(api, lost32) };
  const att = await send(txs, 'guardian tries to initiate on an account with no friend groups', w('lorna'), await P.initiate(lost32, 0), { expectFail: true });
  evidence('C1', { title: 'Counterfactual: a wallet without Kedge, key discarded', expected: 'balance unmovable; no path exists', pass: snap.friendGroups === 0 && snap.inheritor === null && !att.tx.ok,
    account: addr, state: snap, keyKept: !mnemonicDiscarded, onChainAttempt: att.tx, note: 'No friend groups means no inheritor can ever be set. The funds are at an address nobody can sign for.' });
  evidence('C2', { title: 'Counterfactual: EVM-only vault position without Kedge', expected: 'unreachable forever', pass: BigInt(snap.vaultSavings) > 0n && snap.friendGroups === 0, account: addr, vaultSavingsKUSD: snap.vaultSavings,
    note: 'withdrawAllTo only pays out for msg.sender == saver. Nobody can be the saver without the key.', txs });
  console.log('C1/C2', JSON.stringify(snap), att.tx.error);
}
console.log('campaign finished'); process.exit(0);
