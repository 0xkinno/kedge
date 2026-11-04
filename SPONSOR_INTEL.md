# SPONSOR_INTEL

What Portaldot V3 gives Kedge, and what was checked. Every row says whether it was verified live on
2026-11-04 (against `wss://test-node-v3.portaldot.dev`) or is still to be proven in the probes (Phase 3).

## 1. Founder primitive: one account across two contract VMs and the native pallets
Portaldot V3 runs `pallet-revive` (EVM bytecode) and `pallet-contracts` (ink!) beside the full FRAME set.

| Fact | Status |
|---|---|
| Runtime `portaldot-v3`, spec 3002, 69 pallets | verified (metadata) |
| `revive`, `contracts`, `assets`, `utility`, `balances`, `proxy`, `multisig`, `identity`, `nominationPools` present | verified |
| `Revive.NativeToEthRatio` = 10000, `AutoMap` = true | verified |
| Native decimals 14, ss58 prefix 42, existential deposit 10^13 planck (0.1 tPOT) | verified |
| Twin rule: EVM address becomes AccountId32 `h160 + 0xEE * 12` | verified by `ReviveApi_account_id` on the build wallet (exact byte match). Reverse direction and non-EE accounts: probe part 2 |
| Block time | measured 6.00 s over 50 blocks (head 316102). A 10-block drill delay is about 60 s |
| `ReviveApi_runtime_pallets_address` | verified: `0x6d6f646c70792f70616464720000000000000000` |

## 2. Newest primitive: Recovery with friend groups

Upstream: polkadot-sdk, "Recovery pallet modernization", PR
[paritytech/polkadot-sdk#10482](https://github.com/paritytech/polkadot-sdk/pull/10482), commit dated
**2026-05-01** (from `git log` of `substrate/frame/recovery`; PR page not fetchable here, so the merge time
is the commit time). Later upstream changes: migration fixes #12123 (2026-05-20), try-state checks #12490
(2026-09-28). The live V3 runtime carries the reworked pallet, not the legacy one.

Live metadata, pallet index 30 (verified):

| Call | Index | Arguments (as named on V3) |
|---|---|---|
| control_inherited_account | 30,0 | recovered: MultiAddress, call: Call |
| revoke_inheritor | 30,1 | none |
| set_friend_groups | 30,2 | friendGroups: Vec<PalletRecoveryFriendGroup> |
| initiate_attempt | 30,3 | lost: MultiAddress, friendGroupIndex: u32 |
| approve_attempt | 30,4 | lost, friendGroupIndex |
| finish_attempt | 30,5 | lost, friendGroupIndex |
| cancel_attempt | 30,6 | lost, friendGroupIndex |
| slash_attempt | 30,7 | friendGroupIndex |

Events (verified): AttemptInitiated, AttemptApproved, AttemptFinished, AttemptDiscarded, AttemptCanceled,
AttemptSlashed, FriendGroupsChanged, InheritorRevoked, RecoveredAccountControlled.
Errors (verified, 23): includes NotFriend, NotApproved, NotYetInheritable, NotYetCancelable, AlreadyVoted,
AlreadyApproved, HigherPriorityRecovered, FriendsNotSortedOrUnique, LostAccountInFriendGroup, NoCancelDelay,
TooManyFriendsNeeded, NotInheritor, NoInheritor, HasOngoingAttempts, DuplicateFriendGroups, NoFriendsNeeded.
Storage: friendGroups, attempt, inheritor.

Upstream source read (reference only): `control_inherited_account` always returns Ok when the signer is the
inheritor; the inner result appears only in `RecoveredAccountControlled { call_result }`. Calls of the
Recovery pallet are filtered inside it (reentrancy guard). `set_friend_groups` is refused while attempts are
ongoing. Friends must be sorted and unique.

### Two live findings that change the plan (verified)
1. **`Recovery.SecurityDeposit` = 0 on V3.** The instruction assumed a non-zero deposit that `slash_attempt`
   burns. With a zero deposit, slashing an attempt costs the attacker nothing, so scenario A5 ("initiator's
   security deposit gone") cannot show a burned amount. The cancel-delay game (A6) and the owner's ability to
   cancel still work. This must be reported and the A5 claim reworded to what is measured. The friend-group
   and inheritor storage deposits (consideration) are separate and still to be measured in probe part 3.
2. **`MaxFriendsPerConfig` = 100**, much higher than the upstream default. The spec says up to 10 groups; the
   group count limit is `TooManyFriendGroups` and is not a constant, so it is measured in probe part 3.

Also: V3's block-number type for `inheritance_delay` and the provider (`provided_block_number`) are to be read
in probe part 3. Nothing is assumed.

## 3. Pallets address
Verified value above. Still to prove in the probes: an EOA Ethereum transaction to it dispatches a native call
(part 4), Recovery calls dispatch from an EOA (part 5), a contract calling it is a no-op (part 8), and the
Ethereum hash to extrinsic matching rule (part 9).

## 4. Supporting primitives
| Primitive | Status |
|---|---|
| `utility.force_batch` | verified present (also batch, batch_all, dispatch_as, if_else) |
| `assets` pUSD id 7777 | verified: name "Portaldot USD (test)", 6 decimals, supply 100,000 pUSD, not frozen, owned by `5Eph8MeAG5mBCZCN5nsX3bdgx9LeFMnaUJnRFfo9eVaTseZv` |
| ERC-20 precompile for assets | address formula from the instruction; to be proven in Phase 5 |
| `revive.call` inside `control_inherited_account` | headline mechanism, probe part 7 |
| `ReviveApi_call` dry run | probe part 7 and Survey |
| `pallet-contracts` ink! | stretch only |

## 5. Depth ladder

| Primitive | Shallow | Deep | Newest |
|---|---|---|---|
| EVM on revive | deploy a Solidity contract from a native account | MetaMask drives native pallets through the pallets address | MetaMask drives a 5-step social recovery and a cross-VM sweep through it |
| Recovery | not used by any sample (checked, see reference lane map) | friend groups with threshold and delay | priorities, inheritance replacement, slash and cancel-delay game, control_inherited_account wrapping revive.call |
| Utility | batch_all | force_batch with per-item results surfaced | nested inside control_inherited_account, results read from events |
| Assets | read a balance | ERC-20 precompile spend from Solidity | rescued by the inheritor in the same sweep as EVM state |

## 6. Availability
| Resource | Status |
|---|---|
| Public WS and EVM RPC | up, answered all queries on 2026-11-04 |
| Faucet | none public. Funding is a Discord ticket to registered participants |
| Build wallet | generated (deployer), address in the Gate 1 report, balance 0 until funded |
