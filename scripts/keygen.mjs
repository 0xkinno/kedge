#!/usr/bin/env node
// Testnet key generator. Usage: node scripts/keygen.mjs [name ...]   (default: deployer)
// Writes keys/<name>.json (mode 600, gitignored) and prints ADDRESSES ONLY.
// Each key is one secp256k1 key: it is the MetaMask address (h160) and, through the
// Portaldot twin rule (h160 followed by twelve 0xEE bytes), also a native 5... account.
import { Wallet, getBytes, hexlify } from 'ethers';
import { encodeAddress, mnemonicGenerate, cryptoWaitReady } from '@polkadot/util-crypto';
import { Keyring } from '@polkadot/keyring';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';

const NAMES = process.argv.slice(2);
if (NAMES.length === 0) NAMES.push('deployer');

const twinOf = (h160) => {
  const a = getBytes(h160);
  const out = new Uint8Array(32); out.set(a, 0); out.fill(0xee, 20);
  return out;
};

mkdirSync('keys', { recursive: true, mode: 0o700 });
await cryptoWaitReady();
for (const name of NAMES) {
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error(`bad name ${name}`);
  const file = `keys/${name}.json`;
  if (existsSync(file)) { console.log(`${name}: exists, not overwritten (${file})`); continue; }
  if (name.startsWith('sr-')) { // native sr25519 account (SubWallet style guardian)
    const mnemonic = mnemonicGenerate();
    const pair = new Keyring({ type: 'sr25519', ss58Format: 42 }).addFromMnemonic(mnemonic);
    const rec = { name, kind: 'sr25519', network: 'portaldot-v3-testnet', note: 'testnet only', ss58: pair.address, mnemonic };
    writeFileSync(file, JSON.stringify(rec, null, 2), { mode: 0o600 });
    console.log(`${name}\n  native sr25519 (5...)  ${pair.address}\n  saved                  ${file} (mode 600)`);
    continue;
  }
  const w = Wallet.createRandom();
  const twin = twinOf(w.address);
  const rec = {
    name, network: 'portaldot-v3-testnet', note: 'testnet only, never use on a real network',
    h160: w.address, twinHex: hexlify(twin), twinSs58: encodeAddress(twin, 42),
    privateKey: w.privateKey, mnemonic: w.mnemonic.phrase,
  };
  writeFileSync(file, JSON.stringify(rec, null, 2), { mode: 0o600 });
  console.log(`${name}\n  evm (MetaMask)  ${rec.h160}\n  native (5...)   ${rec.twinSs58}\n  saved           ${file} (mode 600)`);
}
