# Kedge Kit

Add recovery to a Portaldot dApp. Your user keeps the MetaMask they already have. Two guardians they choose can bring the account back after a safety delay they set, and one signature moves everything to a new wallet. This is the engine that runs the Kedge app, packaged so other apps can use it.

It relies on Portaldot V3's Recovery pallet, reached from MetaMask through the runtime pallets address. Facts it was built on are measured on the live testnet: see `PLATFORM_PROBE.md` and `docs/FINDINGS.md` in the repository.

```bash
npm install kedge-kit ethers @polkadot/api @polkadot/util @polkadot/util-crypto   # when published; in this repository: packages/kedge-kit
```

## Example 1: protect the connected account with two guardians

```ts
import { twinOf, scale, sendRuntimeCall, checkGroups, KedgeRefusal } from 'kedge-kit';

const hex = (u: Uint8Array) => '0x' + Buffer.from(u).toString('hex');
const rpc = async (method: string, params: unknown[]) =>
  (await (await fetch('https://test-evm-rpc-v3.portaldot.dev', { method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) })).json()).result;

export async function protect(owner: string, guardians: [string, string], newPhone: string) {
  const group = { friends: guardians.map(twinOf), friendsNeeded: 2, inheritor32: twinOf(newPhone),
                  inheritanceDelay: 43200, priority: 1, cancelDelay: 7200 };      // 72 h at 6 s a block
  checkGroups(twinOf(owner), [group]);                                             // throws KedgeRefusal on a bad setup
  const call = scale.setFriendGroups([{ friends: guardians.map(twinOf).map(hex).sort(), friendsNeeded: 2,
    inheritor: hex(twinOf(newPhone)), inheritanceDelay: 43200, inheritancePriority: 1, cancelDelay: 7200 }]);
  return sendRuntimeCall((window as any).ethereum, rpc, owner, call, (h) => localStorage.setItem('kedge:pending', h));
}
```

`sendRuntimeCall` estimates gas from the chain, sends one Ethereum transaction to the pallets address, and persists the hash before waiting. The user's own wallet signs; nothing here holds a key.

## Example 2: read the true outcome of a rescue

The Ethereum receipt can say success while the inner call failed. Read the events.

```ts
import { api, resolveOutcome } from 'kedge-kit';

const out = await resolveOutcome(await api(), rpc, hash);   // matches the extrinsic by keccak256(payload) == tx hash
console.log(out.controlResult);        // 'Ok' or { Err: ... } from RecoveredAccountControlled.call_result
console.log(out.items);                // [{ status: 'completed' | 'failed', error? }] one per force_batch item
console.log(out.errorName);            // e.g. 'recovery.NotYetInheritable' when the call was refused
```

## What is in the box

| Export | Job |
|---|---|
| `twinOf`, `h160Of` | the MetaMask address and its native twin, both ways |
| `callPhrase`, `phraseMatches` | four words that bind (lost wallet, new wallet, group, chain), so a guardian can catch a scam link |
| `setFriendGroups`, `initiate`, `approve`, `finish`, `cancel`, `slash`, `bringHome` | build calls from live metadata (polkadot.js) |
| `scale` | the same calls with no dependencies, byte-equal to polkadot.js |
| `sendRuntimeCall`, `resolveOutcome` | send from the user's wallet and read the real result |
| `checkGroups`, `refuseContractInheritor`, `KedgeRefusal` | pre-flight refusals, including the contract-inheritor trap |
| `inventory`, `plan` | what the old account holds and which sweep items will move |
| `friendGroups`, `attempts`, `inheritor`, `delayClock` | read recovery state and the delay clock |

## Things worth knowing

- A refused Recovery call is an extrinsic success plus `revive.EthExtrinsicRevert` with receipt status 0. `resolveOutcome` decodes it.
- A contract cannot be the inheritor: a contract calling the pallets address does nothing. `refuseContractInheritor` stops it.
- Guardians must be sorted bytewise and unique. `purser` sorts and refuses duplicates.

Tests: `npm test` (offline) and `KEDGE_LIVE=1 npm test` (adds a live byte-for-byte check). MIT.
