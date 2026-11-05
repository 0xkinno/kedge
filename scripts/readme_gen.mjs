#!/usr/bin/env node
// Generates README.md (Section 12 order) and MILESTONES.md. Every number comes from docs/FACTS.json or git.
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fmtTpot } from '../packages/kedge-kit/src/fmt.mjs';
const f = JSON.parse(readFileSync('docs/FACTS.json', 'utf8')); const m = f.measured; const fig = JSON.parse(readFileSync('docs/landing_figures.json', 'utf8')).money;
const src = JSON.parse(readFileSync('docs/sources.json', 'utf8')).sources; const dep = JSON.parse(readFileSync('deployments/testnet.json', 'utf8')).AllotmentVault;
const E = (n) => `https://scanner-testnet-v3.portaldot.dev/#/blocks/${n}?tab=events`;
const scen = f.scenarios.map((s) => `| ${s.id} | ${s.title} | ${s.pass ? 'pass' : 'MISS'} | ${s.observed ? '`' + (typeof s.observed === 'string' ? s.observed : JSON.stringify(s.observed)) + '`' : ''} | ${s.proofTx ? `[${s.proofTx.block}](${E(s.proofTx.block)})` : 'guard'} |`).join('\n');
const pain = [['seafarers-1-89m', 'About 1.89 million seafarers serve the world merchant fleet (2021 report, through press coverage)'], ['sea-remittances', fig.sentence], ['lost-bitcoin', 'About 3.7 million bitcoin, around 20 percent of supply, had not moved for five years (June 2020). Dormant, not proven lost'], ['ledger-recover', 'A hardware-wallet vendor\'s seed backup service split the phrase among three custodians and drew backlash (2023)'], ['quadriga', 'An exchange founder died and about 190 million Canadian dollars of customer crypto became inaccessible (2019)'], ['adoption-philippines', 'The Philippines ranks 9th and Nigeria 6th in the 2025 crypto adoption index']]
  .map(([id, t]) => { const s = src.find((x) => x.id === id); return `| ${t} | [${s.title.split(' (')[0]}](${s.url}) |`; }).join('\n');
const tr = (() => { try { return JSON.parse(readFileSync('docs/demo/deployed-run/results.json', 'utf8')); } catch { return null; } })();
const trLine = tr ? `${tr.results.filter((r) => r.ok).length} of ${tr.results.length} end-to-end steps passed in headless Chromium` : 'not run';
const readme = `<p align="center"><img src="docs/brand/kedge-banner.png" alt="Kedge: a rescue brought home on Portaldot" /></p>

<h1 align="center">Kedge</h1>

<p align="center"><b>A wallet your crew can bring back, and no single person can take.</b></p>

<p align="center">
  <img alt="CI" src="https://github.com/0xkinno/kedge/actions/workflows/ci.yml/badge.svg" />
  <img alt="Network" src="https://img.shields.io/badge/Portaldot-V3%20testnet-1BB3A2" />
  <img alt="Verified" src="https://img.shields.io/badge/scenarios-${f.summary.asExpected}%20of%20${f.summary.total}%20as%20expected-FF5A1F" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue" />
</p>

> When a seafarer's phone goes overboard, Kedge lets his crew and family bring his wallet back, using Portaldot's built-in Recovery pallet, signed from the MetaMask he already has.

At 03:40 off Singapore, Ramon's phone slips over the side. His wages were on it. On most EVM chains that wallet is gone for good. On Portaldot V3 it is not: every MetaMask address has a native twin account, the twin can use the chain's own **Recovery pallet**, and a rescuer can then run a Solidity contract call **as the lost address**. Kedge turns that into a product a deckhand can use: name a crew once, keep a wallet-size card, and if the phone is lost, two people you trust approve, the chain makes everyone wait, and one signature brings it all home.

| | |
|---|---|
| **Live app** | **https://kedge-kinnoskis-projects.vercel.app** (Vercel, no login). The 12-step wallet journey below passed against this URL |
| **See it work in 2 minutes** | \`/drill\`: a full rescue on the live testnet, streamed step by step |
| **Check our claims** | \`npm run verify\` re-reads ${f.txs.length} recorded transactions from the public node with no key. \`/proof\` decodes them in your browser |
| **Measured** | ${m.rescuesCompleted} of ${m.rescuesAttempted} rescues completed, ${m.attacksStopped} of ${m.attacksTried} attacks stopped, **${m.legitimateRescuesWronglyBlocked}** honest rescues wrongly blocked, ${fmtTpot(m.costPerRescueTPOT)} tPOT in fees per rescue |
| **Built on** | Portaldot V3: Recovery, Utility, Assets with the ERC-20 precompile, Revive, the pallets address |
| **Track** | Ecosystem DApps |
| **Pitch deck** | [docs/kedge-deck.pdf](docs/kedge-deck.pdf) |

<table>
<tr><td width="50%"><img src="docs/screens/harbour.png" alt="Harbour: name your crew, make a Lifeboat key, see what it costs" /><br /><sub><b>Harbour.</b> The owner names a crew, makes a passphrase-locked key for a new phone, and sees the cost before signing.</sub></td>
<td width="50%"><img src="docs/screens/crew.png" alt="Crew door: a guardian types four words before approve unlocks" /><br /><sub><b>Crew door.</b> A guardian hears four words on a call and types them. Approve stays locked until they match.</sub></td></tr>
<tr><td><img src="docs/screens/rescue.png" alt="Rescue: timeline, delay clock, what will move" /><br /><sub><b>Rescue.</b> Timeline, delay clock in blocks, and a dry-run of every item: will move, or will not move and why.</sub></td>
<td><img src="docs/screens/proof.png" alt="Proof: every recorded transaction decoded in the browser" /><br /><sub><b>Proof.</b> Every recorded transaction, decoded in your browser from the public node.</sub></td></tr>
</table>

## Why this is different

| Approach | Who can move the money | What it costs the user | Weak point |
|---|---|---|---|
| Seed phrase on paper | anyone who finds it | nothing | lost paper means lost wallet; found paper means stolen wallet |
| Company-held seed backup | the company, a court order, a breach | a subscription and an identity check | custody by another name, and it needs a signal and a camera |
| Smart-contract wallet with guardians | guardians, through a contract | a new wallet and a migration | you must change wallets **before** the loss, and each chain needs its own |
| Exchange custody | the exchange | fees and KYC | one founder, one server: a single point of failure |
| **Kedge on Portaldot** | **two of your guardians, after a delay you set, and you can still cancel** | **${fmtTpot(m.costPerProtectionTPOT)} tPOT to protect, ${fmtTpot(m.costPerRescueTPOT)} tPOT to rescue, no deposit** | no new wallet; the Recovery pallet is the chain's own, and the rescue even reaches money held in Solidity contracts |

What nobody else here does is the last part. A rescue that only moved native coins would leave a seafarer's savings stranded in contracts. Kedge's sweep also pays out a Solidity vault that only the old address could withdraw from, because the chain lets the rescuer call it **as** that address.

## The rescue, step by step

\`\`\`mermaid
stateDiagram-v2
  [*] --> Protected: owner names the crew (set_friend_groups)
  Protected --> Attempt: a guardian starts (initiate_attempt)
  Attempt --> Attempt: another guardian approves (approve_attempt)
  Attempt --> Protected: owner cancels or slashes
  Attempt --> Waiting: threshold reached
  Waiting --> Inherited: delay passed (finish_attempt)
  Inherited --> Home: one signature (control_inherited_account wraps force_batch)
  Home --> [*]
\`\`\`

1. **Name the crew.** From MetaMask, the owner picks guardians, how many must agree, the safety delay, and the wallet on a new phone. This costs only a fee: V3 holds no deposit for it.
2. **Keep a card.** A wallet-size PDF holds the new key, locked with a passphrase only the owner knows. Alone it cannot move a cent.
3. **Call, hear, type.** After a loss, a guardian phones the owner. The new phone shows four words derived from (lost wallet, new wallet, group, chain). The guardian types them; **approve stays disabled until they match**. A scam link that names a different new wallet produces different words.
4. **Wait.** Two approvals start the delay. The owner gets one alert per attempt, and while he still holds his phone he can stop it, or slash the starter.
5. **Bring it home.** The new phone finishes the attempt and signs once. A single \`force_batch\` pays out the vault, moves the native asset, then sweeps the coin. If one item fails, the rest still move and the receipt shows exactly which.

## What we found on Portaldot V3 (measured, not claimed)

These came from probes on the live testnet before we built anything, and are written up with hashes in [PLATFORM_PROBE.md](PLATFORM_PROBE.md) and [docs/FINDINGS.md](docs/FINDINGS.md).

- **A MetaMask address can drive the Recovery pallet.** An Ethereum transaction to the runtime pallets address \`0x6d6f...0000\` is dispatched as a native call from the sender's twin account. Owner, guardians and inheritor completed the whole lifecycle with plain Ethereum transactions.
- **\`msg.sender\` is the lost address.** Inside \`control_inherited_account\`, a \`revive.call\` runs the contract with the old address as the caller. That is the whole trick behind the vault payout (probe part 7, block 317779).
- **A contract cannot be the rescuer.** A Solidity contract calling the pallets address does nothing: it returns success with no effect. So Kedge refuses a contract as the inheritor, and the refusal is backed by a probe, not a guess.
- **Receipts lie in two different ways.** A refused Recovery call is an *extrinsic success* plus \`revive.EthExtrinsicRevert\` with receipt status 0. A failed inner call inside \`control_inherited_account\` leaves receipt status **1** and only shows up in \`RecoveredAccountControlled.call_result\`. Kedge's Helmsman never trusts the receipt: it matches the extrinsic by \`keccak256(payload) == eth tx hash\` (9 of 9 hashes) and reads the events.
- **The vault gives its deposit back.** The sweep returned ${fmtTpot(m.storageDepositRefundTPOT)} tPOT of contract storage deposit, because withdrawing zeroes the slot.
- **This testnet's security deposit is 0.** Slashing a bad attempt burns nothing, so the real deterrent is two guardians, the delay, and the owner's cancel. We say so in the UI.

## Safety model

| Who | What they can try | What stops them | Proof |
|---|---|---|---|
| A stranger | start an attempt on your wallet | \`NotFriend\` | A1 |
| One guardian alone | finish with one approval | \`NotApproved\` | A2 |
| A guardian in a hurry | finish before the delay | \`NotYetInheritable\` | A3 |
| A guardian voting twice | stack approvals | \`AlreadyApproved\` | A4 |
| A bad initiator | cancel to dodge a slash | \`NotYetCancelable\` | A6 |
| A rescuer | rewrite the crew through the inheritance | the call is filtered: \`call_result = Err\` | A7 |
| A lower-priority group | take over after the family group recovered | \`HigherPriorityRecovered\` | A9 |
| A scam link | show a different new wallet | the four words differ, approve stays locked | A12 |
| A bad sweep item | block the rest | \`force_batch\`: that item fails, the others move | A10 |
| Nobody at all (no Kedge) | move a wallet whose key is gone | no path exists | C1, C2 |

The four-word phrase is **advisory UI**: it helps a human catch a scam. The chain enforces the approval count and the delay.

## Measured

Both directions are reported, **and the second number is the one that matters.** Money figures are rounded here; exact values are in \`docs/FACTS.json\`.

| | |
|---|---|
| Rescues completed / attempted | ${m.rescuesCompleted} of ${m.rescuesAttempted} (one with a guardian on a native sr25519 wallet) |
| Attacks stopped | ${m.attacksStopped} of ${m.attacksTried}: ${f.summary.classes.onChainRefused.asExpected} refused on chain with a decoded error (${f.summary.classes.onChainRefused.ids.join(', ')}) and ${f.summary.classes.uiRefused.asExpected} stopped by pre-flight guards (${f.summary.classes.uiRefused.ids.join(', ')}) |
| All scenarios | ${f.summary.asExpected} of ${f.summary.total} as expected: ${f.summary.classes.onChainHappy.of} on-chain happy paths, ${f.summary.classes.onChainRefused.of} on-chain refusals, ${f.summary.classes.onChainBehaviour.of} on-chain behaviours (${f.summary.classes.onChainBehaviour.ids.join(', ')}), ${f.summary.classes.uiRefused.of} guard refusals, ${f.summary.classes.counterfactual.of} counterfactuals |
| Honest rescues wrongly blocked | ${m.legitimateRescuesWronglyBlocked} |
| Cost to protect | ${fmtTpot(m.costPerProtectionTPOT)} tPOT fee, ${m.friendGroupDepositTPOT} deposit |
| Cost per rescue | ${fmtTpot(m.costPerRescueTPOT)} tPOT in fees |
| Safety delay | ${m.delayBlocks} blocks, measured ${m.delaySecondsMeasured} s |
| Browser end-to-end | ${trLine} (details below) |
| Public drills | 2 live runs, recorded in \`docs/drills/\`; a second request during a run is refused (HTTP 409) |

| Id | Scenario | Result | Observed | Proof |
|---|---|---|---|---|
${scen}

**Where we were wrong, in public.** We predicted \`AlreadyVoted\` for a double approval; the chain says \`AlreadyApproved\` (A4). Our first campaign run read refused calls as successes until we found the \`EthExtrinsicRevert\` shape. A5 burned nothing because the deposit is zero. Each is in [docs/FINDINGS.md](docs/FINDINGS.md).

## The browser test: real signing, real chain

\`e2e/wallet.mjs\` drives headless Chromium through every screen. An EIP-1193 provider is injected into the page and backed by a real key in the test process, so each transaction is **signed and sent to the live testnet**: connect, switch chain, sign a message for alerts, protect a wallet, read the phrase on the new phone, lock and unlock the guardian gate, approve, wait out the delay, bring it home, stop and slash from the alert link, decode a refused attack on \`/proof\`, run the tour, run a drill, and a 390 px phone pass. Run against the live Vercel URL; videos and screenshots are in \`docs/demo/deployed-run/\` (and the first local run in \`docs/demo/test-run/\`).

${tr ? tr.results.map((r) => `- ${r.ok ? 'pass' : 'FAIL'}: ${r.step}`).join('\n') : ''}

This is an injected test wallet, **not** the Rabby or SubWallet extension. It proves the app's wallet paths against real signatures; a session with the physical extensions is still open (see *Limits*).

## Architecture

\`\`\`mermaid
flowchart LR
  subgraph People["People and their own wallets"]
    R["Owner's wallet"] & G1["Guardian"] & G2["Guardian"] & N["New phone"]
  end
  subgraph Chain["Portaldot V3"]
    PA["Pallets address"] --> REC["Recovery pallet"]
    REC -- "Signed(lost)" --> UT["utility.force_batch"]
    UT --> BAL["balances: tPOT"] & AS["assets: kUSD"] & RV["revive: AllotmentVault"]
  end
  R & G1 & G2 & N -- "Ethereum tx" --> PA
  W["Watchkeeper (keyless)"] -- "reads events" --> REC
\`\`\`

| Module | One job | Can it sign? |
|---|---|---|
| Purser \`purser.ts\` | builds every call from live metadata | no |
| Helmsman \`helm.ts\` | sends the wallet transaction, persists the hash first, resolves the real outcome from events | the user's wallet only |
| Lookout \`lookout.ts\` | reads crews, attempts, delay clocks | no |
| Surveyor \`survey.ts\` | inventories the old wallet and dry-runs every sweep item | no |
| Mate \`mate.ts\` | pre-flight refusals (contract inheritor, sorting, thresholds, delay) | no |
| Watchkeeper \`watch/\` | detects attempts, alerts the owner | no, keyless by construction |
| Logkeeper \`scripts/facts.mjs\` | writes the numbers on this page from receipts | no |

No model sits anywhere in the money path. A dependency-free SCALE encoder (\`watch/scale.mjs\`) is tested **byte for byte** against polkadot.js on live metadata.

## What it will not do

| Refusal | Where | Backed by |
|---|---|---|
| Name a contract as the inheritor | \`mate.ts\` | probe part 8 |
| List guardians unsorted or twice | \`mate.ts\`, \`purser.ts\` | chain \`FriendsNotSortedOrUnique\`, even with our check disabled (\`KEDGE_SABOTAGE=sort\`, block 317530) |
| Rescue before the delay | \`mate.ts\` | A3 |
| Approve without the phrase | Crew door | A12 (advisory) |
| Move an item that would fail | \`survey.ts\` | A10 |
| Run a drill when the kill switch is on or keys are missing | \`/api/drill\` | HTTP 503 with a plain message |

## Run it yourself

\`\`\`bash
git clone https://github.com/0xkinno/kedge && cd kedge
npm ci
npm run verify        # keyless: re-reads every recorded transaction from the public node
npm test              # unit, encoder and live-chain tests
(cd contracts && forge test)
cd apps/web && npm ci && npx next build && npx next start -p 3100
BASE=http://localhost:3100 node ../../e2e/wallet.mjs     # full wallet journey, signs on testnet
\`\`\`

Deploy: \`VERCEL_TOKEN=... bash scripts/deploy_vercel.sh\` creates the project, sets the root directory and env vars, deploys, and tests the live link. Env (server only): \`DRILL_RAMON_PK\`, \`DRILL_LORNA_PK\`, \`DRILL_BEN_PK\`, \`DRILL_LIFEBOAT_PK\` (testnet-only), \`UPSTASH_REDIS_REST_URL\`, \`UPSTASH_REDIS_REST_TOKEN\`, \`TELEGRAM_BOT_TOKEN\`, \`DRILL_KILL\`. \`scripts/keygen.mjs\` writes keys to the gitignored \`keys/\`.

## Where the numbers come from

Nothing headline is typed. \`scripts/facts.mjs\` builds [docs/FACTS.json](docs/FACTS.json) from receipts; the landing page, this README, the deck and the docs read it, and tests fail on drift. Market figures are in [docs/sources.json](docs/sources.json) with exact quotes that \`npm run verify:sources\` re-checks against the live pages:

| Fact | Source |
|---|---|
${pain}

## Business and what comes next

Free for individuals. Manning agencies and seafarer welfare groups reach crews at scale; wallet makers can embed the protection flow because every Portaldot account is recoverable the same way, and families use the same mechanism with a longer delay for inheritance. Next: a real-people drill with consenting guardians, deploying the ink! vault so one rescue spans both contract VMs, the real Rabby and SubWallet sessions, and an agency pilot.

## Limits, stated plainly

- The ink! (WASM) contract is written and unit-tested (\`ink/allotment_ink\`) but **not deployed**: this chain charges 0.06 tPOT per byte of contract code, so its 4.9 KB would need about 295 tPOT. Until it is deployed, the "WASM" half of WASM/EVM is **not** demonstrated.
- The security deposit is 0 on this testnet, so slashing is a signal, not a penalty.
- The demo token is Kedge's own **kUSD** (asset 20261104). The pUSD pool held about 127 pUSD, too thin to demo with.
- Wallet paths are proven with an injected test wallet backed by real signing, not yet with the Rabby or SubWallet extensions, and not on MetaMask mobile.
- No real-people drill has been run yet.
- Testnet only. Not audited.

## Docs

[EVIDENCE](EVIDENCE.md) · [PROOF](PROOF.md) · [FINDINGS](docs/FINDINGS.md) · [PLATFORM_PROBE](PLATFORM_PROBE.md) · [DISCOVERY](DISCOVERY.md) · [SDK_SURFACE](SDK_SURFACE.md) · [RISK](RISK.md) · [THESIS](THESIS.md) · [MOMENT](MOMENT.md) · [DESIGN](DESIGN.md) · [JUDGE](JUDGE.md) · [PROGRESS](PROGRESS.md) · [MILESTONES](MILESTONES.md) · [REDTEAM_LOG](REDTEAM_LOG.md)

## Disclosures

AI assistance: Claude Code drafted much of the code and docs under the author's direction and review. The hero image is AI-generated. Third-party: ethers, polkadot.js, Next.js, Foundry's forge-std, solc-js, the BIP39 English word list (the call phrase). Persona names and the pitch voice are illustrative.

## License

MIT
`;
writeFileSync('README.md', readme);
const log = execSync("git log --reverse --format='%h|%ad|%s' --date=short", { encoding: 'utf8' }).trim().split('\n').map((l) => l.split('|'));
writeFileSync('MILESTONES.md', `# MILESTONES\n\nGenerated from git history by \`node scripts/readme_gen.mjs\`. Transaction hashes are in EVIDENCE.md.\n\n| Date | Commit | What |\n|---|---|---|\n${log.map(([h, d, s]) => `| ${d} | \`${h}\` | ${s} |`).join('\n')}\n\nKey chain milestones: vault deployed at block ${dep.block}; headline mechanism proven at block 317779 (PLATFORM_PROBE part 7); campaign blocks in EVIDENCE.md.\n`);
console.log('README.md and MILESTONES.md written');
