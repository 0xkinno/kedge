#!/usr/bin/env node
// Usage: node scripts/probe.mjs 1 2 3     Each part writes evidence/probe/part<N>.json
import { connect, evm, save, twin, ss58, loadKey, PALLETS, hexlify } from './lib.mjs';
import { keccak256, getBytes } from 'ethers';

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

for (const n of parts) { console.log(`--- part ${n}`); console.log(JSON.stringify(await P[n](), null, 1)); }
await api.disconnect();
process.exit(0);
