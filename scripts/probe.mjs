#!/usr/bin/env node
// Usage: node scripts/probe.mjs 1 2 3     Each part writes evidence/probe/part<N>.json
import { connect, evm, save, twin, ss58, loadKey, PALLETS, hexlify, wallet, sendRuntime, sleep, resolve } from './lib.mjs';
import { keccak256, getBytes, Interface } from 'ethers';
import { readFileSync } from 'node:fs';

const parts = process.argv.slice(2).map(Number);
const api = await connect();
const provider = evm();
const P = {};

P[1] = async () => {
  const head = await api.rpc.chain.getHeader(); const n = head.number.toNumber();
  const t1 = (await api.query.timestamp.now()).toNumber();
  const t0 = (await api.query.timestamp.now.at(await api.rpc.chain.getBlockHash(n - 100))).toNumber();
  return save(1, {
    specName: api.runtimeVersion.specName.toString(), specVersion: api.runtimeVersion.specVersion.toNumber(),
    genesis: api.genesisHash.toHex(), pallets: api.runtimeMetadata.asLatest.pallets.length,
    decimals: api.registry.chainDecimals[0], ss58: api.registry.chainSS58, token: api.registry.chainTokens[0],
    existentialDeposit: api.consts.balances.existentialDeposit.toString(),
    nativeToEthRatio: api.consts.revive.nativeToEthRatio.toString(), autoMap: api.consts.revive.autoMap?.toString(),
    gasPriceWei: (await provider.getFeeData()).gasPrice.toString(), evmChainId: (await provider.getNetwork()).chainId.toString(),
    head: n, blockTimeSeconds: ((t1 - t0) / 100 / 1000),
  });
};

P[2] = async () => {
  const pa = await api.rpc.state.call('ReviveApi_runtime_pallets_address', '0x');
  const out = { palletsAddress: pa.toHex(), matchesConstant: pa.toHex() === PALLETS, forward: [], reverse: [] };
  for (const name of ['deployer', 'ramon']) {
    const k = loadKey(name);
    const raw = await api.rpc.state.call('ReviveApi_account_id', k.h160);
    out.forward.push({ name, h160: k.h160, chain: raw.toHex(), ours: hexlify(twin(k.h160)), match: raw.toHex() === hexlify(twin(k.h160)) });
    const back = await api.rpc.state.call('ReviveApi_address', raw.toHex());
    out.reverse.push({ kind: 'eth-twin', account: raw.toHex(), chainH160: back.toHex(), expected: k.h160.toLowerCase(), match: back.toHex() === k.h160.toLowerCase() });
  }
  const sr = loadKey('sr-guardian'); const { decodeAddress } = await import('@polkadot/util-crypto');
  const acct = hexlify(decodeAddress(sr.ss58));
  const back = await api.rpc.state.call('ReviveApi_address', acct);
  const keccakRule = hexlify(getBytes(keccak256(acct)).slice(12));
  out.reverse.push({ kind: 'sr25519', ss58: sr.ss58, account: acct, chainH160: back.toHex(), keccakRule, match: back.toHex() === keccakRule });
  return save(2, out);
};

P[3] = async () => {
  const meta = {};
  for (const [k, c] of Object.entries(api.tx.recovery)) meta[k] = { index: c.callIndex.toString(), args: c.meta.args.map((a) => ({ name: a.name.toString(), type: a.type.toString() })) };
  const fg = api.registry.createType('PalletRecoveryFriendGroup');
  const fgFields = Object.fromEntries(Object.entries(fg.toJSON()).map(([k]) => [k, fg.get(k).toRawType()]));
  const consts = Object.fromEntries(Object.entries(api.consts.recovery).map(([k, v]) => [k, v.toString()]));
  const storage = {};
  for (const [k, q] of Object.entries(api.query.recovery)) if (q.creator) storage[k] = q.creator.meta.type.toString().slice(0, 140);
  const views = Object.keys(api.call).filter((k) => /recovery/i.test(k));
  return save(3, {
    calls: meta, friendGroupFields: fgFields, constants: consts,
    blockNumberType: api.registry.createType('BlockNumber').toRawType(),
    events: Object.keys(api.events.recovery), errors: Object.keys(api.errors.recovery), storage, runtimeApisMatchingRecovery: views,
    holdReasons: api.registry.getDefinition ? undefined : undefined,
  });
};

P[4] = async () => { // EOA tx to the pallets address with system.remark_with_event lands; also settles part 9 (hash matching rule)
  const who = wallet('ramon', provider);
  const call = api.tx.system.remarkWithEvent('0x6b6564676520' + '70726f6265').method.toHex();
  const r = await sendRuntime(api, who, call);
  return save(4, { from: who.address, callHex: call, ethHash: r.hash, receiptStatus: r.receipt.status, gasUsed: r.receipt.gasUsed.toString(),
    block: r.outcome.block, extrinsicIndex: r.outcome.extrinsicIndex, matchRule: r.outcome.matchRule,
    remarkedEventSeen: r.outcome.events.some((e) => e.event === 'system.Remarked'), events: r.outcome.events });
};

const A = (name) => { const k = loadKey(name); return k.h160 ? hexlify(twin(k.h160)) : hexlify(api.createType('AccountId32', k.ss58).toU8a()); };
const holds = async (name) => { const k = loadKey(name); const a = k.twinSs58 ?? k.ss58; return (await api.query.balances.holds(a)).map((h) => ({ id: h.id.toHuman(), amount: h.amount.toString() })); };
const free = async (name) => { const k = loadKey(name); return (await api.query.system.account(k.twinSs58 ?? k.ss58)).data.free.toString(); };
const sortBytes = (xs) => [...xs].sort((a, b) => Buffer.compare(Buffer.from(a.slice(2), 'hex'), Buffer.from(b.slice(2), 'hex')));
const GROUP = () => ({ friends: sortBytes([A('lorna'), A('ben'), A('ana')]), friendsNeeded: 2, inheritor: A('lifeboat'), inheritanceDelay: 10, inheritancePriority: 1, cancelDelay: 2 });

P[5] = async () => { // set_friend_groups from a MetaMask-style EOA
  const who = wallet('ramon', provider);
  const before = { holds: await holds('ramon'), free: await free('ramon') };
  const call = api.tx.recovery.setFriendGroups([GROUP()]).method.toHex();
  const r = await sendRuntime(api, who, call);
  const stored = (await api.query.recovery.friendGroups(A('ramon'))).toHuman();
  return save(5, { ethHash: r.hash, receiptStatus: r.receipt.status, block: r.outcome.block, callHex: call,
    changedEvent: r.outcome.events.some((e) => e.event === 'recovery.FriendGroupsChanged'),
    before, after: { holds: await holds('ramon'), free: await free('ramon') }, stored, events: r.outcome.events });
};

P[6] = async () => { // full mini rescue: initiate (lorna), approve (ben), wait delay, finish (lifeboat), control (lifeboat)
  const lost = A('ramon'); const steps = []; const note = (label, r) => { steps.push({ label, ethHash: r.hash, block: r.outcome.block, events: r.outcome.events.map((e) => e.error ? `${e.event}:${e.error}` : e.event), raw: r.outcome.events.filter((e) => /recovery\./.test(e.event)) }); return r; };
  const snap = async (label) => ({ label, lorna: { holds: await holds('lorna'), free: await free('lorna') }, ramonFree: await free('ramon'), lifeboatFree: await free('lifeboat'),
    attempt: (await api.query.recovery.attempt(lost, 0)).toHuman() });
  const snaps = [await snap('before')];
  note('initiate_attempt (lorna)', await sendRuntime(api, wallet('lorna', provider), api.tx.recovery.initiateAttempt({ Id: lost }, 0).method.toHex()));
  snaps.push(await snap('after initiate'));
  note('approve_attempt (ben)', await sendRuntime(api, wallet('ben', provider), api.tx.recovery.approveAttempt({ Id: lost }, 0).method.toHex()));
  snaps.push(await snap('after approve'));
  const att = (await api.query.recovery.attempt(lost, 0)).toJSON(); const t0 = Date.now();
  const initBlock = att?.[0]?.initBlock ?? att?.[0]?.init_block ?? null;
  const target = initBlock != null ? Number(initBlock) + 10 : (await api.rpc.chain.getHeader()).number.toNumber() + 10;
  // an early finish must be refused: send it on chain (campaign scenario A3 in miniature)
  let early; try { early = await sendRuntime(api, wallet('lifeboat', provider), api.tx.recovery.finishAttempt({ Id: lost }, 0).method.toHex()); } catch (e) { early = { error: String(e.shortMessage ?? e.message).slice(0, 160) }; }
  steps.push({ label: 'finish_attempt too early', result: early.outcome ? early.outcome.events.map((e) => e.error ? `${e.event}:${e.error}` : e.event) : early.error });
  while ((await api.rpc.chain.getHeader()).number.toNumber() < target + 1) await sleep(3000);
  const waitedSeconds = (Date.now() - t0) / 1000;
  note('finish_attempt (lifeboat)', await sendRuntime(api, wallet('lifeboat', provider), api.tx.recovery.finishAttempt({ Id: lost }, 0).method.toHex()));
  snaps.push(await snap('after finish'));
  const inheritor = (await api.query.recovery.inheritor(lost)).toHuman();
  const inner = api.tx.balances.transferKeepAlive(loadKey('lifeboat').twinSs58, 5n * 10n ** 14n);
  const c = await sendRuntime(api, wallet('lifeboat', provider), api.tx.recovery.controlInheritedAccount({ Id: lost }, inner).method.toHex());
  note('control_inherited_account(balances.transfer_keep_alive)', c);
  snaps.push(await snap('after control'));
  const ev = c.outcome.events.find((e) => e.event === 'recovery.RecoveredAccountControlled');
  return save(6, { initBlock, targetBlock: target, waitedSeconds, inheritor, steps, snaps,
    controlReceiptStatus: c.receipt.status, controlCallResult: ev?.data?.callResult ?? ev?.data });
};

P[7] = async () => { // HEADLINE: msg.sender inside revive.call run by control_inherited_account is the lost H160
  const lost = A('ramon'); const ramonH160 = loadKey('ramon').h160; const dep = JSON.parse(readFileSync('deployments/probes.json', 'utf8'));
  const probe = dep.SenderProbe.address; const iface = new Interface(JSON.parse(readFileSync('contracts/out/SenderProbe.json', 'utf8')).abi);
  const data = iface.encodeFunctionData('ping', []);
  const dry = await api.call.reviveApi.call(lost, probe, 0, null, null, data);
  const dj = dry.toJSON();
  const gas = dj.gasRequired ?? dj.weightRequired; const sd = dj.storageDeposit;
  const refTime = BigInt(gas.refTime) * 12n / 10n, proof = BigInt(gas.proofSize) * 12n / 10n;
  const sdLimit = sd?.charge ? BigInt(sd.charge) * 12n / 10n + 10n ** 12n : 10n ** 13n;
  const inner = api.tx.revive.call(probe, 0, { refTime, proofSize: proof }, sdLimit, data);
  const r = await sendRuntime(api, wallet('lifeboat', provider), api.tx.recovery.controlInheritedAccount({ Id: lost }, inner).method.toHex());
  const ev = r.outcome.events.find((e) => e.event === 'recovery.RecoveredAccountControlled');
  const last = await provider.call({ to: probe, data: iface.encodeFunctionData('last', []) });
  const seen = '0x' + last.slice(26);
  const logs = await provider.getLogs({ address: probe, fromBlock: r.receipt.blockNumber, toBlock: r.receipt.blockNumber });
  // Q7: an inner call that must fail (transfer more than the account holds) - what does the receipt say?
  const bad = api.tx.balances.transferKeepAlive(loadKey('lifeboat').twinSs58, 10n ** 20n);
  const f = await sendRuntime(api, wallet('lifeboat', provider), api.tx.recovery.controlInheritedAccount({ Id: lost }, bad).method.toHex());
  const fev = f.outcome.events.find((e) => e.event === 'recovery.RecoveredAccountControlled');
  return save(7, { probeContract: probe, ramonH160, dryRun: dj, ethHash: r.hash, receiptStatus: r.receipt.status, block: r.outcome.block,
    callResult: ev?.data?.callResult ?? ev?.data, lastSenderOnChain: seen, msgSenderIsLostH160: seen.toLowerCase() === ramonH160.toLowerCase(),
    seenEventLogs: logs.map((l) => ({ topics: l.topics, data: l.data })), events: r.outcome.events.map((e) => e.error ? `${e.event}:${e.error}` : e.event),
    failingInner: { ethHash: f.hash, receiptStatus: f.receipt.status, callResult: fev?.data?.callResult ?? fev?.data, extrinsicFailed: f.outcome.events.some((e) => e.event === 'system.ExtrinsicFailed') } });
};

P[8] = async () => { // a Solidity contract calling the pallets address runs nothing
  const dep = JSON.parse(readFileSync('deployments/probes.json', 'utf8')); const iface = new Interface(JSON.parse(readFileSync('contracts/out/Caller.json', 'utf8')).abi);
  const w = wallet('deployer', provider); const price = (await provider.getFeeData()).gasPrice;
  const remark = api.tx.system.remarkWithEvent('0x636f6e74726163742d63616c6c').method.toHex();
  const data = iface.encodeFunctionData('poke', [remark]);
  const gas = await provider.estimateGas({ from: w.address, to: dep.Caller.address, data });
  const tx = await w.sendTransaction({ to: dep.Caller.address, data, gasLimit: gas * 13n / 10n, gasPrice: price }); const rc = await tx.wait();
  const o = await resolve(api, tx.hash, rc);
  const called = rc.logs.map((l) => { try { return iface.parseLog(l); } catch { return null; } }).filter(Boolean).map((l) => ({ ok: l.args.ok, returnSize: l.args.returnSize.toString() }));
  return save(8, { callerContract: dep.Caller.address, ethHash: tx.hash, receiptStatus: rc.status, block: o.block, calledEvent: called,
    remarkedEventSeen: o.events.some((e) => e.event === 'system.Remarked'), events: o.events.map((e) => e.event),
    note: 'Compare with part 4: the same call sent by an EOA to the pallets address emits System.Remarked.' });
};

for (const n of parts) { console.log(`--- part ${n}`); console.log(JSON.stringify(await P[n](), null, 1)); }
await api.disconnect();
process.exit(0);
