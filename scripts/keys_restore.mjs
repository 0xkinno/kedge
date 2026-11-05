#!/usr/bin/env node
// Rebuild the gitignored keys/ folder from .env.local, so any machine (or agent) can reuse the same testnet wallets
// (the deployer that deployed the vault, the cast, the house crew) without redeploying anything.
// Usage: node scripts/keys_restore.mjs [--check]   --check compares to existing keys/ without writing.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { Wallet, getBytes } from 'ethers';
import { encodeAddress, cryptoWaitReady, mnemonicValidate } from '@polkadot/util-crypto';
import { Keyring } from '@polkadot/keyring';
const check = process.argv.includes('--check');
if (!existsSync('.env.local')) { console.error('No .env.local found. Ask Kinnoski for it.'); process.exit(1); }
await cryptoWaitReady(); mkdirSync('keys', { recursive: true, mode: 0o700 });
const twin = (h) => { const o = new Uint8Array(32); o.set(getBytes(h), 0); o.fill(0xee, 20); return o; };
let n = 0, bad = 0;
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = /^KEDGE_([A-Z0-9_]+)_(PK|MNEMONIC)=(.*)$/.exec(line.trim()); if (!m) continue;
  const name = m[1].toLowerCase().replace(/_/g, '-'); const val = m[3].replace(/^"|"$/g, ''); let rec;
  if (m[2] === 'PK') { const w = new Wallet(val); rec = { name, network: 'portaldot-v3-testnet', note: 'testnet only', h160: w.address, twinHex: '0x' + Buffer.from(twin(w.address)).toString('hex'), twinSs58: encodeAddress(twin(w.address), 42), privateKey: val }; }
  else { if (!mnemonicValidate(val)) throw new Error(`bad mnemonic for ${name}`); const p = new Keyring({ type: 'sr25519', ss58Format: 42 }).addFromMnemonic(val); rec = { name, kind: 'sr25519', network: 'portaldot-v3-testnet', note: 'testnet only', ss58: p.address, mnemonic: val }; }
  const f = `keys/${name}.json`;
  if (check) { if (!existsSync(f)) { console.log('missing', f); bad++; continue; } const cur = JSON.parse(readFileSync(f, 'utf8')); const same = (cur.h160 ?? cur.ss58) === (rec.h160 ?? rec.ss58); console.log(same ? 'match ' : 'DIFFER', name, rec.h160 ?? rec.ss58); if (!same) bad++; }
  else { writeFileSync(f, JSON.stringify(rec, null, 2), { mode: 0o600 }); console.log('restored', name, rec.h160 ?? rec.ss58); }
  n++;
}
console.log(`${n} keys ${check ? 'checked' : 'restored'}${bad ? `, ${bad} problem(s)` : ''}`); process.exit(bad ? 1 : 0);
