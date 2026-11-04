# FINDINGS pre-registration

Written and committed BEFORE probes 6, 7 and 8 are run (probes 1 to 3 are read-only and may run earlier).
Each question has a prediction and a rule for what a result means. Results go to `FINDINGS.md`, positive
and negative, whatever they say. Predictions are not edited after this commit; a wrong prediction is
recorded as wrong.

| # | Question | Prediction | If the prediction fails |
|---|---|---|---|
| Q1 | Does an Ethereum tx from an EOA to the pallets address dispatch every Recovery call (set_friend_groups, initiate, approve, finish, cancel, slash, control_inherited_account)? | Yes, all 8 | Note which calls are filtered. Use SubWallet for those roles (Plan A-minus) |
| Q2 | Does `control_inherited_account(revive.call(vault.withdrawAllTo(dest)))` run the contract with `msg.sender` equal to the lost account's H160? | Yes | STOP. Report to Kinnoski. Vault claim becomes "designed". Plan A without vault, or Plan B |
| Q3 | Does a Solidity contract calling the pallets address with a valid `system.remark_with_event` run nothing (no `System.Remarked`)? | Yes, a silent no-op | Delete the contract-inheritor refusal and its claim |
| Q4 | Recovery constants on V3: `SecurityDeposit`, `MaxFriendsPerConfig`, consideration costs, block-number type | SecurityDeposit = 0 (already read live: 0), MaxFriendsPerConfig = 100 (read live), consideration costs small but non-zero | Record measured values |
| Q5 | After a rescue, is the friend-group storage deposit stranded on the old account? How much? | Yes, stranded, because Recovery calls are filtered inside control_inherited_account | Record amount; if releasable, document how |
| Q6 | `balances.transfer_all` with `keep_alive` true versus false on an account holding a Recovery hold | keep_alive=false moves the free balance only and the hold stays; keep_alive=true leaves at least the ED | Record both outcomes |
| Q7 | Receipt `status` for `control_inherited_account` when the inner call fails | status 1 (outer succeeded), failure only in `RecoveredAccountControlled.call_result` | If status 0, the receipt is usable and the UI can say so |
| Q8 | Block time and the real time of a 10-block inheritance delay | about 6 s per block, so about 60 s | Record measured |
| Q9 | Does the Ethereum tx hash equal keccak256 of the signed payload carried inside `revive.eth_transact`? | Yes | Find the real matching rule from block events |
| Q10 | Does a slash of an attempt with a zero security deposit succeed and emit `AttemptSlashed`? | Yes, with nothing burned | Record the actual behaviour |

Decision table (V5 and instruction Section 13): Q1 and Q2 yes = Plan A. Q1 yes and Q2 no = Plan A without
the vault claim. Q1 no = SubWallet for Recovery roles (A-minus). Recovery unusable = Plan B (proxy with delay).
