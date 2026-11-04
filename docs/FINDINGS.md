# FINDINGS (friction report, measured on V3, 2026-11-04)

Positive and negative results both. Questions were pre-registered in `docs/FINDINGS_PREREG.md` (commit
`059260908a6ba139a07c26b2cc1c803dd95ab528`) before probes 6 to 8. Evidence: `evidence/probe/`, summary in
`PLATFORM_PROBE.md`. Items marked OPEN are measured later in the campaign.

| # | Question | Prediction | Measured | Verdict |
|---|---|---|---|---|
| Q1 | EOA tx to the pallets address dispatches Recovery calls | all 8 | set_friend_groups, initiate_attempt, approve_attempt, finish_attempt, control_inherited_account all dispatched and succeeded. cancel_attempt and slash_attempt not yet sent | right so far, OPEN for 2 calls |
| Q2 | `msg.sender` inside `revive.call` run by `control_inherited_account` is the lost H160 | yes | yes: `SenderProbe.last()` returned the lost address, and the `Seen` log carries it | right |
| Q3 | contract calling the pallets address runs nothing | yes | outer ok, call returned `true` with 0 bytes, no `System.Remarked` | right |
| Q4 | Recovery constants and costs | SecurityDeposit 0, MaxFriendsPerConfig 100, small consideration | SecurityDeposit 0 and MaxFriendsPerConfig 100 as read. Friend-group storage: no hold at all. Attempt: `SecurityDeposit` hold of 0 taken and released. Block number type u32 | right on constants; consideration is zero, not small |
| Q5 | friend-group deposit stranded after a rescue | yes, some amount | there is no deposit to strand: set_friend_groups cost only its 0.0270 tPOT fee and created no hold, reserve or freeze | wrong in a good way |
| Q6 | transfer_all keep_alive true vs false on an account with a hold | differs | OPEN, there is no Recovery hold to test with; will test with a Revive storage-deposit hold | OPEN |
| Q7 | receipt status when the inner call fails | 1 | 1. The failing inner call shows only as `call_result = Err(Token(FundsUnavailable))` and `ExtrinsicFailed` is absent | right |
| Q8 | block time, 10-block delay | 6 s, 60 s | 6.00 s over 100 blocks. Approval at block 316752, finish accepted after block 316760 (init 316750 + 10), wall wait 52 s from approve | right |
| Q9 | hash to extrinsic rule | keccak256(payload) | matched 9 of 9 recorded txs | right |
| Q10 | slash with a zero deposit | succeeds, burns nothing | OPEN, slash_attempt not yet sent | OPEN |

## Things that were not predicted

1. **Failing Recovery calls cannot be estimated.** `eth_estimateGas` for `finish_attempt` before the delay
   returns "missing revert data" with no error name. To show a refusal on chain, send with an explicit gas limit
   and read the decoded `System.ExtrinsicFailed` error from the block. The campaign does this.
2. **The lost account pays contract storage deposits.** When the inheritor runs `revive.call` as the lost
   account, a first-time storage write is charged to the lost account: 3.84 tPOT (`Revive.StorageDepositReserve`)
   for `SenderProbe.ping()`. The lost account must keep enough tPOT for deposits during the sweep. The vault
   withdraw frees a slot and should return its deposit; to be measured in H1.
3. **Zero security deposit.** Slashing an attempt cannot burn anything on V3 as configured. The slash and
   cancel-delay game still exists as an owner control, but there is no financial penalty for a bad initiator
   beyond fees. Scenario A5 will report what is measured, not a burned amount.
4. **Value transfers add 0.1 tPOT.** EVM value transfers from the deployer to six fresh EVM addresses credited
   0.1 tPOT more than the amount sent (for example 30 sent, 30.1 free). A native `balances.transfer_keep_alive`
   to a fresh sr25519 account credited exactly the amount. Cause not established; recorded as observed.
5. **Deploy cost.** A 212-byte contract cost 27.4 tPOT and a 427-byte contract 44.1 tPOT to deploy. The vault
   (1143 bytes) is estimated at 92.4 tPOT.
6. **Fees.** A `remark_with_event` through the pallets address cost 0.0133 tPOT, `set_friend_groups` 0.0270.
   Receipts show `gasUsed` 0, so costs come from `balances.Withdraw` and `TransactionFeePaid` events.
