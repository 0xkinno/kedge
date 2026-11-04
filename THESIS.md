# THESIS

```
NAME:       Kedge  (kedging: hauling a stranded vessel free on an anchor that others row out and set)
MOMENT:     Ramon, an able seaman, at 03:40 off Singapore, when his phone goes overboard and a
            seed-phrase wallet holding his savings has no way back.
ACTION:     Two of his three guardians confirm it is really him and approve; after the safety
            delay, one MetaMask signature moves his tPOT, his test dollars and what his allotment
            contract owes him to his new phone.
DISCOVERY:  everyone assumes a MetaMask address without its seed is gone; in reality its native
            twin can use Portaldot's Recovery pallet, and Solidity contracts pay the rescued
            address back because control_inherited_account runs revive.call as the lost account.
            Measured on V3 testnet, PLATFORM_PROBE.md parts 4 to 8.
PROOF:      generated from real testnet runs: rescues completed, attacks stopped (each with a
            decoded on-chain refusal), legitimate rescues wrongly blocked (target 0, measured),
            cost per protection and per rescue in tPOT.
```

**Hook (20 seconds, spoken).** "Three forty in the morning, off Singapore. Ramon's phone just went over the
side. His savings were on it. On every other EVM chain, that money is gone. On Portaldot, his wife and his
bosun can bring it back."

**X without Y.** A wallet your crew can bring back, and no single person can take.

**Primary guarantee.** No single person, including any one guardian, the Kedge server, or a thief holding the
Lifeboat Card, can move Ramon's money. Two guardians plus the safety delay plus the card are required, and
Ramon can stop any attempt he did not start while he still holds his phone.

**Honest limit on the guarantee.** Because V3's security deposit is 0, a malicious initiator risks nothing but
fees. The chain still enforces the threshold and the delay, and the owner can cancel. The deterrent is the
guardians' judgment, not money.

## Crew (each module has one job, typed output, no model in the money path)

| Role | Module | Job | Can sign? |
|---|---|---|---|
| Purser | `lib/kedge/purser.ts` | builds every RuntimeCall from live metadata | no |
| Helmsman | `lib/kedge/helm.ts` | sends a wallet tx to the pallets address, persists the hash first, resolves the extrinsic and its events | the user's wallet only |
| Lookout | `lib/kedge/lookout.ts` | reads Recovery storage, computes delay clocks | no |
| Watchkeeper | `watch/` | detects attempts on protected accounts, alerts the owner | no, keyless |
| Surveyor | `lib/kedge/survey.ts` | inventories the lost account and dry-runs each sweep item | no |
| Mate | `lib/kedge/mate.ts` | pre-flight refusals | no |
| Logkeeper | `scripts/facts.mjs` | writes FACTS.json from receipts | no |
