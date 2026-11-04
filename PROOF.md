# PROOF

Generated from `docs/FACTS.json` (testnet receipts) by `node scripts/docs_gen.mjs`. Both directions are reported: attacks stopped, and legitimate rescues wrongly blocked. **The second number is the one that matters.**

## Measured

| | |
|---|---|
| Rescues completed / attempted (curated campaign) | 2 of 2 |
| Attacks stopped | 9 of 9, each with a decoded on-chain refusal or a recorded guard |
| Legitimate rescues wrongly blocked | **0** |
| Cost to protect a wallet | 0.02700572815675 tPOT in fees, deposits 0 |
| Cost per rescue (initiate, approve, finish, control) | 0.06293 tPOT in fees |
| Security deposit on this testnet | 0 tPOT |
| Contract storage deposit refunded during the sweep | 3.79868674820199 tPOT |
| Safety delay | 10 blocks, measured 55 s |
| Moved to the new key in H1 | 13.99 tPOT, 150 kUSD (including the vault position) |
| Real-people drill | not yet run, see README |

## Scenarios

| Id | Scenario | Expected | Observed | Result | Proof |
|---|---|---|---|---|---|
| H1 | Happy path: setup, initiate, approve, wait, finish, bring home (tPOT + kUSD + vault) | all items ItemCompleted; balances moved to the new key; vault Withdrawn(saver = old address) | `Ok` | pass | [317396](https://scanner-testnet-v3.portaldot.dev/#/blocks/317396?tab=events) |
| H2 | Cross-VM guardians: one sr25519 guardian approves with a native extrinsic, two on MetaMask | completes | `Ok` | pass | [317418](https://scanner-testnet-v3.portaldot.dev/#/blocks/317418?tab=events) |
| A1 | A1 | recovery.NotFriend | `recovery.NotFriend` | pass | [317445](https://scanner-testnet-v3.portaldot.dev/#/blocks/317445?tab=events) |
| A2 | A2 | recovery.NotApproved | `recovery.NotApproved` | pass | [317447](https://scanner-testnet-v3.portaldot.dev/#/blocks/317447?tab=events) |
| A3 | A3 | recovery.NotYetInheritable | `recovery.NotYetInheritable` | pass | [317450](https://scanner-testnet-v3.portaldot.dev/#/blocks/317450?tab=events) |
| A4 | A4 | recovery.AlreadyApproved | `recovery.AlreadyApproved` | pass | [317449](https://scanner-testnet-v3.portaldot.dev/#/blocks/317449?tab=events) |
| A5 | A5 | AttemptSlashed |  | pass | [317451](https://scanner-testnet-v3.portaldot.dev/#/blocks/317451?tab=events) |
| A6 | A6 | recovery.NotYetCancelable | `recovery.NotYetCancelable` | pass | [317453](https://scanner-testnet-v3.portaldot.dev/#/blocks/317453?tab=events) |
| A7 | Reentrancy guard: inheritor tries to rewrite recovery config through control_inherited_account | receipt ok, RecoveredAccountControlled.call_result = Err | `{"Err":{"Module":{"index":"0","error":"0x05000000"}}}` | pass | [317482](https://scanner-testnet-v3.portaldot.dev/#/blocks/317482?tab=events) |
| A8 | Priority override: Family (priority 0) finishes after Crew | AttemptFinished { previous_inheritor = Crew inheritor } |  | pass | [317480](https://scanner-testnet-v3.portaldot.dev/#/blocks/317480?tab=events) |
| A9 | Priority lock: Crew tries again after Family recovered | recovery.HigherPriorityRecovered | `recovery.HigherPriorityRecovered` | pass | [317481](https://scanner-testnet-v3.portaldot.dev/#/blocks/317481?tab=events) |
| A10 | Sweep with one item that must fail | other items ItemCompleted, one ItemFailed | `Ok` | pass | [317483](https://scanner-testnet-v3.portaldot.dev/#/blocks/317483?tab=events) |
| A11 | Contract set as inheritor | refused by Mate; on-chain probe shows contract to pallets address is a no-op |  | pass | recorded guard |
| A12 | Scam link with a different inheritor | call phrase mismatch, approve disabled |  | pass | recorded guard |
| C1 | Counterfactual: a wallet without Kedge, key discarded | balance unmovable; no path exists |  | pass | recorded guard |
| C2 | Counterfactual: EVM-only vault position without Kedge | unreachable forever |  | pass | [317489](https://scanner-testnet-v3.portaldot.dev/#/blocks/317489?tab=events) |

## Misses and surprises

- **Misses (scenario did not do what was expected):** none.
- **A4 name miss:** the instruction predicted `AlreadyVoted`; V3 returned `AlreadyApproved`. The refusal held. The pass criterion was amended after the run, openly (`scripts/amend_a4.mjs`).
- **A5:** nothing was burned because the security deposit is 0 on this testnet.
- **A11 and A12** are guards (library refusal, phrase mismatch) with a recorded on-chain probe for A11; they are not failed extrinsics.
- **C1 and C2:** the account key was never written to disk. The on-chain attempt by a guardian returned `NoFriendGroups`.

See `FINDINGS.md` for platform behaviour that was not predicted.
