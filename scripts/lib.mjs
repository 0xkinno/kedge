// Shared helpers for probes and the campaign. Keys are read from keys/ (gitignored), never printed.
import { ApiPromise, WsProvider } from '@polkadot/api';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { JsonRpcProvider, Wallet, getBytes, hexlify } from 'ethers';
import { encodeAddress } from '@polkadot/util-crypto';

export const NET = {
  ws: 'wss://test-node-v3.portaldot.dev', http: 'https://test-node-v3.portaldot.dev',
  evm: 'https://test-evm-rpc-v3.portaldot.dev', chainId: 420420777, explorer: 'https://scanner-testnet-v3.portaldot.dev',
};
export const PALLETS = '0x6d6f646c70792f70616464720000000000000000';
export const twin = (h160) => { const a = getBytes(h160); const o = new Uint8Array(32); o.set(a, 0); o.fill(0xee, 20); return o; };
export const ss58 = (u8) => encodeAddress(u8, 42);
export const loadKey = (name) => JSON.parse(readFileSync(`keys/${name}.json`, 'utf8'));
export async function connect() {
  return ApiPromise.create({ provider: new WsProvider(NET.ws), noInitWarn: true });
}
export const evm = () => new JsonRpcProvider(NET.evm, { chainId: NET.chainId, name: 'portaldot-v3' }, { staticNetwork: true });
export const wallet = (name, provider = evm()) => new Wallet(loadKey(name).privateKey, provider);
export function save(part, obj) {
  mkdirSync('evidence/probe', { recursive: true });
  const rec = { part, at: new Date().toISOString(), ...obj };
  writeFileSync(`evidence/probe/part${part}.json`, JSON.stringify(rec, (_, v) => (typeof v === 'bigint' ? v.toString() : v), 2) + '\n');
  return rec;
}
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export { hexlify, getBytes };
