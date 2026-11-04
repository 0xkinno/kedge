# RISK

All numbers below were measured on the live V3 testnet (see `FINDINGS.md`, `PLATFORM_PROBE.md`).

## Deposits: held versus lost
| Item | Measured | Refundable |
|---|---|---|
| `Recovery.SecurityDeposit` | 0 (constant, and a 0-amount hold taken and released in a real attempt, block 316750 and 316763) | n/a |
| Friend-group storage (`set_friend_groups`) | no hold, reserve or freeze; cost is the fee only, 0.0270 tPOT | n/a |
| Inheritor registration | `ticket: None`, no deposit | n/a |
| Contract storage deposit during a sweep | charged to the lost account: 3.84 tPOT for one new storage slot | to be measured on the vault withdraw (campaign H1) |
| Fees | `remark_with_event` 0.0133 tPOT, `set_friend_groups` 0.0270 tPOT | no |

**Stranded friend-group deposit:** none exists on V3 (measured: no hold). The instruction expected one; this is
a favourable surprise and is disclosed, not hidden.

## Maximum loss per role
| Role | Worst case on V3 as measured |
|---|---|
| Owner | loses nothing if he can cancel before the delay ends. If he has lost his phone and two guardians collude, the funds go to the group's inheritor. That is the design. Choose guardians accordingly |
| One guardian | cannot move anything alone (threshold 2 of 3 is enforced by `NotApproved`) |
| Guardian who initiates a bad attempt | loses only fees (security deposit is 0) |
| Kedge server | holds no key in the money path. It can lie in the UI, but cannot sign. The phrase check is advisory |
| Thief with the Lifeboat Card | cannot act without two guardians and the delay. The card is encrypted with the owner's passphrase |

## Trust and keys
- **House drill keys** (`DRILL_*_PK`) are testnet-only and held server-side. They sign only drills, are capped, and are labelled "house crew" on every screen. They never sign for a real user.
- **The call phrase is advisory UI.** It binds (lost, inheritor, group, chain) so a link with a different inheritor shows different words, but the chain enforces the threshold and the delay, not the phrase.
- **Inheritor must not be a contract** (`INHERITOR_IS_CONTRACT`): a contract calling the pallets address does nothing (probe part 8).
- **Receipts are not trusted.** Status is 1 even when the inner call fails (probe part 7); the Helmsman reads events.
- **Test asset.** The demo token is `kUSD` (asset 20261104), created by Kedge on testnet. `pUSD` (7777) was not used because its tPOT pool holds about 127 pUSD, so a 200 pUSD demo could not be bought.
- **Testnet only.** Nothing here is audited. Do not use real funds.

## Name check ("Kedge", 2026-11-04)
- npm `kedge`: exists (a React state hook, last modified 2022). `kedging`: free. `salvor`: taken.
- GitHub: 274 repositories match "kedge" in the name, led by two Kubernetes tools (299 and 257 stars). None is a crypto project.
- Web search for a "Kedge" crypto project or token found none (closest unrelated: Kedaenge, Kedolik Swap, Edge).
- Decision: keep **Kedge**. Not published to npm (package is private). Backups if challenged: Kedging, Salvor.
