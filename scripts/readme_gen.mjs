#!/usr/bin/env node
// Generates README.md (Section 12 order) and MILESTONES.md. Every number comes from docs/FACTS.json or git.
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const f = JSON.parse(readFileSync('docs/FACTS.json', 'utf8')); const m = f.measured; const fig = JSON.parse(readFileSync('docs/landing_figures.json', 'utf8')).money;
const src = JSON.parse(readFileSync('docs/sources.json', 'utf8')).sources; const dep = JSON.parse(readFileSync('deployments/testnet.json', 'utf8')).AllotmentVault;
const E = (n) => `https://scanner-testnet-v3.portaldot.dev/#/blocks/${n}?tab=events`;
const scen = f.scenarios.map((s) => `| ${s.id} | ${s.title} | ${s.pass ? 'pass' : 'MISS'} | ${s.observed ? '`' + (typeof s.observed === 'string' ? s.observed : JSON.stringify(s.observed)) + '`' : ''} | ${s.proofTx ? `[${s.proofTx.block}](${E(s.proofTx.block)})` : 'guard'} |`).join('\n');
const pain = [['seafarers-1-89m', 'About 1.89 million seafarers serve the world merchant fleet (2021 report, through press coverage)'], ['sea-remittances', fig.sentence], ['lost-bitcoin', 'About 3.7 million bitcoin, around 20 percent of supply, had not moved for five years (June 2020). Dormant, not proven lost'], ['ledger-recover', 'A hardware-wallet vendor\'s seed backup service split the phrase among three custodians and drew backlash (2023)'], ['quadriga', 'An exchange founder died and about 190 million Canadian dollars of customer crypto became inaccessible (2019)'], ['adoption-philippines', 'The Philippines ranks 9th and Nigeria 6th in the 2025 crypto adoption index']]
  .map(([id, t]) => { const s = src.find((x) => x.id === id); return `| ${t} | [${s.title.split(' (')[0]}](${s.url}) |`; }).join('\n');
const readme = `<p align="center"><img src="docs/brand/kedge-banner.png" alt="Kedge: a rescue brought home on Portaldot" /></p>

# Kedge

![CI](https://github.com/0xkinno/kedge/actions/workflows/ci.yml/badge.svg) ![License](https://img.shields.io/badge/license-MIT-blue) ![Network](https://img.shields.io/badge/Portaldot-V3%20testnet-1BB3A2)

**When a seafarer's phone goes overboard, Kedge lets his crew and family bring his wallet back, using Portaldot's built-in Recovery pallet, signed from the MetaMask he already has.**

A wallet your crew can bring back, and no single person can take.

Ramon is a fictional able seaman. His phone goes over the side at 03:40 off Singapore. Two of his three guardians confirm on a call that it is really him and approve from their own wallets. After a safety delay his new phone brings home his tPOT, his test dollars and what his allotment contract holds, with one signature. All of it runs on the Portaldot V3 testnet today.

| | |
|---|---|
| Live app | **Not deployed yet.** Run it locally (below). The Vercel deploy needs the owner's account |
| For judges | \`/judge\` (60-second walk) |
| Run a rescue | \`/drill\` (about two minutes, testnet, house crew keys) |
| Verify it yourself | \`/proof\`, or \`npm run verify\` with no key |
| Demo video | a silent recording of the guided tour is in [docs/demo/tour-silent.webm](docs/demo/tour-silent.webm); the final video with live wallet clips is not recorded yet |
| Pitch deck | [docs/kedge-deck.pdf](docs/kedge-deck.pdf) |
| Track | Ecosystem DApps |
| Built on | Portaldot V3: Recovery, Utility, Assets and the ERC-20 precompile, Revive, the pallets address |
| Measured | ${m.rescuesCompleted} of ${m.rescuesAttempted} rescues completed, ${m.attacksStopped} of ${m.attacksTried} attacks stopped, **${m.legitimateRescuesWronglyBlocked}** legitimate rescues wrongly blocked, ${m.costPerRescueTPOT} tPOT in fees per rescue |

| Harbour | Crew door |
|---|---|
| ![Harbour](docs/screens/harbour.png) | ![Crew door](docs/screens/crew.png) |
| **Rescue** | **Proof** |
| ![Rescue](docs/screens/rescue.png) | ![Proof](docs/screens/proof.png) |

## The problem

Ramon is seven months into a nine-month contract on a bulk carrier. His wages sit in a wallet on his phone. His seed phrase is on a scrap of paper in a drawer in Iloilo, or nowhere. A seed-phrase wallet has no "forgot password", custodial apps want identity checks from a ship with no signal, and a company-run seed backup means handing his keys to a company. Ramon, Lorna, Ana and Ben are fictional and labelled so on every screen.

| What is true | Source |
|---|---|
${pain}

Exact quotes, dates and caveats are in [docs/sources.json](docs/sources.json); \`npm run verify:sources\` re-checks them against the live pages.

## The solution

1. Ramon names his crew once, from MetaMask: two of three guardians, a safety delay, and the wallet on his new phone.
2. He prints a wallet-size **Lifeboat Card**. It holds his new key locked with a passphrase only he knows. It cannot move a cent.
3. After the loss, a guardian calls him, hears four words read from his new phone, types them, and starts the attempt. The approve button stays locked until the words match.
4. A second guardian approves. The chain makes everyone wait out the safety delay. Ramon gets one alert per attempt and can stop or punish any attempt he did not start.
5. His new phone finishes the attempt and brings everything home in one signature. A receipt shows each item and its status.

What always gets through: an attempt Ramon did not start reaches him, and he can cancel it while he holds his phone.

## Explore it in 2 minutes

1. Open \`/drill\` and press Start. Watch a full rescue run on testnet.
2. Wait out the live block countdown, then open the receipt and each explorer link.
3. Open \`/proof\`, filter to A3, press Check. The page reads the block from the public node and decodes \`recovery.NotYetInheritable\` in your browser.
4. Open C1: the counterfactual account that nobody can move.

## Architecture

\`\`\`mermaid
flowchart LR
  R["Ramon's wallet"] & L["Lorna"] & B["Ben"] & N["Ramon's new phone"] --> PA["Pallets address 0x6d6f...0000"]
  PA --> REC["Recovery pallet"]
  REC -- "Signed(lost)" --> UT["utility.force_batch"]
  UT --> BAL["balances: tPOT"] & AS["assets: kUSD"] & RV["revive: AllotmentVault"]
  W["Watchkeeper (keyless)"] -- reads events --> REC
\`\`\`

\`\`\`
 Ramon's MetaMask   Lorna    Ben    Ramon's new phone
        |             |       |            |
        v             v       v            v
   Ethereum tx to the Portaldot pallets address (0x6d6f...0000)
 set_friend_groups  initiate approve   finish + control_inherited_account
        '-------------+-------+-------------'
                      v
              Recovery pallet (native)
                      | Signed(Ramon's old account)
                      v
            utility.force_batch([ ... ])
      balances: tPOT | assets: kUSD | revive.call: AllotmentVault (msg.sender = old address)
\`\`\`

## Product flow

\`\`\`mermaid
sequenceDiagram
  actor Ramon
  actor Lorna
  actor Ben
  participant Chain as Portaldot V3
  Ramon->>Chain: set_friend_groups (MetaMask)
  Note over Ramon: 03:40, phone overboard
  Lorna->>Chain: initiate_attempt (after the call phrase)
  Ben->>Chain: approve_attempt
  Note over Chain: safety delay (10 blocks in a drill, 72 h real)
  Ramon->>Chain: finish_attempt (new phone)
  Ramon->>Chain: control_inherited_account(force_batch[...])
  Chain-->>Ramon: receipt: each item with status
\`\`\`

## Why this needs Portaldot

Every MetaMask address has a native twin account (\`h160\` followed by twelve \`0xEE\` bytes, verified against the chain). An Ethereum transaction to the runtime pallets address is dispatched as a native call signed by that twin, so a plain MetaMask address can use the Recovery pallet. When the inheritor runs \`revive.call\` inside \`control_inherited_account\`, a Solidity contract sees the **old address** as \`msg.sender\`, so the vault pays the savings out. Native assets are reached from Solidity through the ERC-20 precompile. Delete Portaldot and step 5 fails. Details: [DISCOVERY.md](DISCOVERY.md), [PLATFORM_PROBE.md](PLATFORM_PROBE.md).

## What it will not do

| Refusal | Where | What backs it |
|---|---|---|
| Contract as inheritor | \`apps/web/lib/kedge/mate.ts\` | probe part 8: a contract calling the pallets address does nothing |
| Guardians not sorted or duplicated | \`mate.ts\`, \`purser.ts\` | chain error \`FriendsNotSortedOrUnique\` (fault switch proof, block 317530) |
| Rescue before the delay | \`mate.ts\` | chain error \`NotYetInheritable\` (A3) |
| Approve without the call phrase | \`apps/web/lib/kedge/phrase.ts\` and the Crew page | advisory UI (A12). The chain enforces threshold and delay |
| A stranger starting an attempt | chain | \`NotFriend\` (A1) |
| A sweep item that would fail | \`survey.ts\` | shown as "Will not move"; \`force_batch\` carries on (A10) |

## Portaldot specifically

See [SDK_SURFACE.md](SDK_SURFACE.md) for the full table with file and line, and the "not used, so not claimed" list. In short: no ink! contract, so the WASM half is not demonstrated.

## Measured

Both directions are reported. **The second number is the one that matters.**

| | |
|---|---|
| Rescues completed / attempted (curated campaign) | ${m.rescuesCompleted} of ${m.rescuesAttempted} |
| Attacks stopped | ${m.attacksStopped} of ${m.attacksTried} |
| Legitimate rescues wrongly blocked | ${m.legitimateRescuesWronglyBlocked} |
| Cost to protect | ${m.costPerProtectionTPOT} tPOT fee, deposits ${m.friendGroupDepositTPOT} |
| Cost per rescue | ${m.costPerRescueTPOT} tPOT in fees |
| Contract storage deposit refunded in the sweep | ${m.storageDepositRefundTPOT} tPOT |
| Real-people drill | **not yet run** (needs 2 to 3 consenting guardians) |

| Id | Scenario | Result | Observed | Proof |
|---|---|---|---|---|
${scen}

Misses and surprises: A4 returned \`AlreadyApproved\`, not the predicted \`AlreadyVoted\` (refusal held). A5 burned nothing because this testnet's security deposit is 0. Full list in [PROOF.md](PROOF.md) and [docs/FINDINGS.md](docs/FINDINGS.md). Two live drills through \`/api/drill\` are recorded in \`docs/drills/\`.

## Security model and limits

- **Trust:** the Kedge server holds no user key. The Watchkeeper is keyless by construction (a test greps for key material).
- **Deposits:** V3 sets the security deposit to 0 and friend groups take no deposit, so a bad initiator risks only fees. Two guardians and the delay are still required.
- **The call phrase is advisory UI.** The chain enforces the threshold and the delay.
- **House drill keys** sign drills only, are capped, and are labelled "house crew" on every screen.
- **Designed, not live:** the unattended Telegram alert run (needs a bot token and Upstash), real-wallet tests on MetaMask mobile, and the public deployment.
- **Testnet only.** Not audited.

## Testnet deployment

| | |
|---|---|
| AllotmentVault | \`${dep.address}\`, deploy tx \`${dep.txHash}\`, block [${dep.block}](${E(dep.block)}) |
| Token | native asset ${dep.tokenAssetId} (kUSD) via the ERC-20 precompile \`${dep.token}\` |
| Every scenario transaction | [EVIDENCE.md](EVIDENCE.md) (${f.txs.length} transactions) |

## Judging criteria map

| Criterion | Where to look |
|---|---|
| Technical Feasibility (30%): "deployed on Portaldot testnet with verifiable on-chain interactions" | \`npm run verify\`, EVIDENCE.md, \`/proof\`, the commit history |
| Innovation (30%): "effective use of Portaldot V3 features such as WASM/EVM compatibility, modular architecture" | DISCOVERY.md, SDK_SURFACE.md (EVM and native pallets in one rescue; ink! not used) |
| Ecosystem Contribution (20%) | docs/FINDINGS.md (first public measurements of Recovery on V3), \`watch/scale.mjs\` (open encoder), the Harbour protection flow any dApp can copy |
| Business Potential (20%) | THESIS.md, the landing page, the sourced market numbers |

## Run it yourself

\`\`\`bash
git clone https://github.com/0xkinno/kedge && cd kedge
npm ci
npm run verify          # keyless: re-reads every recorded tx from the public node
npm test                # 23 tests including live checks
cd apps/web && npm ci && npx next build && npx next start -p 3100
\`\`\`

Env (server only unless prefixed \`NEXT_PUBLIC_\`): \`DRILL_RAMON_PK\`, \`DRILL_LORNA_PK\`, \`DRILL_BEN_PK\`, \`DRILL_LIFEBOAT_PK\` (testnet-only), \`UPSTASH_REDIS_REST_URL\`, \`UPSTASH_REDIS_REST_TOKEN\`, \`TELEGRAM_BOT_TOKEN\`, \`DRILL_KILL=0\`. \`scripts/keygen.mjs\` writes keys to the gitignored \`keys/\`.

## Docs

[EVIDENCE](EVIDENCE.md) · [PROOF](PROOF.md) · [FINDINGS](docs/FINDINGS.md) · [PROGRESS](PROGRESS.md) · [MILESTONES](MILESTONES.md) · [TASK](TASK.md) · [DESIGN](DESIGN.md) · [SDK_SURFACE](SDK_SURFACE.md) · [RISK](RISK.md) · [JUDGE](JUDGE.md) · [THESIS](THESIS.md) · [MOMENT](MOMENT.md)

## Disclosures

AI assistance: Claude Code drafted much of the code and docs, reviewed and directed by the author. Third-party code: ethers, polkadot.js, Next.js, Foundry's forge-std, solc-js, the BIP39 English word list (used for the call phrase). The persona and the spoken pitch voice are synthetic. The hero is an illustration; a photograph is planned. The demo token is Kedge's own kUSD, not pUSD.

## License

MIT
`;
writeFileSync('README.md', readme);
const log = execSync("git log --reverse --format='%h|%ad|%s' --date=short", { encoding: 'utf8' }).trim().split('\n').map((l) => l.split('|'));
writeFileSync('MILESTONES.md', `# MILESTONES\n\nGenerated from git history by \`node scripts/readme_gen.mjs\`. Transaction hashes are in EVIDENCE.md.\n\n| Date | Commit | What |\n|---|---|---|\n${log.map(([h, d, s]) => `| ${d} | \`${h}\` | ${s} |`).join('\n')}\n\nKey chain milestones: vault deployed at block ${dep.block}; headline mechanism proven at block 317779 (PLATFORM_PROBE part 7); campaign blocks in EVIDENCE.md.\n`);
console.log('README.md and MILESTONES.md written');
