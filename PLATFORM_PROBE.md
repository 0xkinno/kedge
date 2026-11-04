# PLATFORM_PROBE

Measured on the live Portaldot V3 testnet on 2026-11-04. Each part is a script run (`node scripts/probe.mjs <n>`)
whose raw output is in `evidence/probe/part<n>.json`. Explorer links open the block's event tab.
Pre-registration (questions and predictions) was committed before parts 6 to 8: commit
`059260908a6ba139a07c26b2cc1c803dd95ab528`, file `docs/FINDINGS_PREREG.md`.

| Part | What was tested | Result | Evidence |
|---|---|---|---|
| 1 | Platform facts | portaldot-v3 spec 3002, 69 pallets, decimals 14, ED 10000000000000 planck (0.1 tPOT), NativeToEthRatio 10000, gas price 22650 wei, block time 6 s, genesis `0xd4f9acbcf7f52388d8b095abe3c198d19fc510e0343e643e87cfbccb155283bd` | part1.json |
| 2 | Pallets address and twin mapping both ways | address `0x6d6f646c70792f70616464720000000000000000` matches the constant. `ReviveApi_account_id` equals `h160 + 0xEE*12` for two accounts. `ReviveApi_address` returns the h160 for those twins. For an sr25519 account it returns the last 20 bytes of keccak256(account), exactly the rule in twin.ts | part2.json |
| 3 | Recovery metadata | pallet 30, calls 0 to 7 as expected, block number type u32, constants SecurityDeposit=0 and MaxFriendsPerConfig=100, FriendGroup fields friends, friendsNeeded, inheritor, inheritanceDelay, inheritancePriority, cancelDelay, 23 errors, 4 storage items | part3.json |
| 4 | EOA tx to the pallets address with `system.remark_with_event` | lands. `System.Remarked` fires with the sender's twin. Receipt `gasUsed` 0. Fee 0.0133 tPOT. Tx `0xe2fdda58d4075225c6c4363a1faa22a3b5413f1212a9d4095c93551ef1d7173d`, block [316733](https://scanner-testnet-v3.portaldot.dev/#/blocks/316733?tab=events) | part4.json |
| 5 | `set_friend_groups` from an EOA | succeeds, `FriendGroupsChanged` fires, fee 0.0270 tPOT, no hold or reserve is taken. Tx `0xe9d18b38e203496a392165b56efef1b190528483e4a62a4425fdef045035599b`, block [316738](https://scanner-testnet-v3.portaldot.dev/#/blocks/316738?tab=events) | part5.json |
| 6 | Full mini rescue, delay 10 blocks | initiate (lorna) block [316750](https://scanner-testnet-v3.portaldot.dev/#/blocks/316750?tab=events), approve (ben) block [316752](https://scanner-testnet-v3.portaldot.dev/#/blocks/316752?tab=events), finish (lifeboat) block [316763](https://scanner-testnet-v3.portaldot.dev/#/blocks/316763?tab=events), control_inherited_account(balances.transfer_keep_alive) block [316765](https://scanner-testnet-v3.portaldot.dev/#/blocks/316765?tab=events), `call_result` Ok, 5 tPOT moved from the lost account to the inheritor. Waited 53 s for 10 blocks | part6.json |
| 7 | **Headline:** `control_inherited_account(revive.call(SenderProbe.ping))` | `msg.sender` inside the contract equals the lost account's H160 `0x85fbBA0fD74dAd192A277DCF5e8B83DA96FCA816`. Contract `0x4DE1eaD45E10bf7158aee2eB945F095272744Adb`. Tx `0x81ba3d35a15cf4d67025702ab2734b8ca2374d90de93b5a498cab48566d3f69f`, block [316779](https://scanner-testnet-v3.portaldot.dev/#/blocks/316779?tab=events). A failing inner call returned receipt status 1 with `call_result` `{"Err": {"Token": "FundsUnavailable"}}` | part7.json |
| 8 | A Solidity contract calls the pallets address | outer tx succeeds, the contract sees `ok = true` with 0 bytes returned, and **no** `System.Remarked` event fires. Contract `0x470CF1b1449Ec2580177045f63AB5BF7e0dBA0f4`. Tx `0x5dfa5618d9261b55e616122af7b03c9c40cafe34179dcd8587a07a4626da81fc`, block [316785](https://scanner-testnet-v3.portaldot.dev/#/blocks/316785?tab=events) | part8.json |
| 9 | Ethereum hash to extrinsic matching rule | `keccak256(revive.eth_transact payload) == eth tx hash` matched for 9 of 9 recorded hashes (`node scripts/recheck_hashes.mjs`), no fallback needed | part4.json `matchRule` |

Probe contracts (throwaway, not part of the product): SenderProbe tx `0x81bb4ac9a6405278a3ff1840861eb2975c93590329a676fcfc027c43ae61b763`,
Caller tx `0xc2bebefa9b878a5338ebf1d9ab21530b37dce6581b2a010061b4631a4e2e516c`. Deployed runtime bytecode equals the compiled artifact for both.

## Decision

Per instruction Section 13: Recovery calls dispatch from MetaMask (Q1 yes for the calls tested: set_friend_groups,
initiate, approve, finish, control_inherited_account; cancel and slash not yet sent), and `revive.call` inside
`control_inherited_account` gives `msg.sender = lost` (Q2 yes). **Plan A, full build.** See FINDINGS.md for what
changed.
