#!/usr/bin/env node
// Generates README.md (the required section order) and MILESTONES.md. Every number comes from docs/FACTS.json, sources.json, deployments or git.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fmtTpot } from '../packages/kedge-kit/src/fmt.mjs';

const rd = (p) => JSON.parse(readFileSync(p, 'utf8'));
const f = rd('docs/FACTS.json'); const m = f.measured; const S = f.summary; const C = S.classes;
const fig = rd('docs/landing_figures.json').money; const src = rd('docs/sources.json').sources;
const dep = rd('deployments/testnet.json').AllotmentVault; const probes = rd('deployments/probes.json');
const LIVE = existsSync('docs/DEPLOYED_URL.txt') ? readFileSync('docs/DEPLOYED_URL.txt', 'utf8').trim() : 'https://kedge-kinnoskis-projects.vercel.app';
const E = (n) => `https://scanner-testnet-v3.portaldot.dev/#/blocks/${n}?tab=events`;
const bl = (n) => `[${n}](${E(n)})`;
const video = existsSync('docs/DEMO_VIDEO.txt') ? readFileSync('docs/DEMO_VIDEO.txt', 'utf8').trim() : null;
const tr = (() => { try { return rd('docs/demo/deployed-run/results.json'); } catch { return null; } })();
const trPass = tr ? tr.results.filter((r) => r.ok).length : 0; const trAll = tr ? tr.results.length : 0;
const kitTests = existsSync('packages/kedge-kit/test') ? readdirSync('packages/kedge-kit/test').length : 0;

const scen = f.scenarios.map((s) => `| ${s.id} | ${s.title} | ${s.pass ? 'as expected' : 'MISS'} | ${s.observed ? '`' + (typeof s.observed === 'string' ? s.observed : JSON.stringify(s.observed)) + '`' : ''} | ${s.proofTx ? bl(s.proofTx.block) : 'guard'} |`).join('\n');
const txRows = f.txs.map((t) => `| ${t.scenario} | ${t.label.replace(/\|/g, '/')} | ${t.ok ? 'ok' : 'refused: `' + t.error + '`'} | ${bl(t.block)} | \`${t.hash.slice(0, 10)}...${t.hash.slice(-6)}\` |`).join('\n');
const sourceRows = ['seafarers-1-89m', 'sea-remittances', 'lost-bitcoin', 'ledger-recover', 'quadriga', 'adoption-philippines'].map((id) => { const s = src.find((x) => x.id === id); return `| ${s.claim} | [${s.title.split(' (')[0]}](${s.url}), ${s.published} |`; }).join('\n');
const first = execSync("git log --reverse --format='%h %ad' --date=format:'%Y-%m-%d' | head -1", { encoding: 'utf8' }).trim().split(' ');
const last = execSync("git log -1 --format='%h %ad' --date=format:'%Y-%m-%d'", { encoding: 'utf8' }).trim().split(' ');
const ncommits = execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim();
const drillLine = f.drills.withTiming ? `${f.drills.completed} completed on the public page; approval to home: min ${f.drills.approvalToHomeSeconds.min} s, median ${f.drills.approvalToHomeSeconds.median} s, max ${f.drills.approvalToHomeSeconds.max} s (${f.drills.withTiming} timed)` : `${f.drills.completed} completed on the public page`;
const rp = f.realPeople ? `${f.realPeople.people} people, see PROOF.md` : 'in preparation (protocol in `docs/REAL_PEOPLE_DRILL.md`)';

const readme = `<h1 align="center">Kedge</h1>

<p align="center">
  <a href="${LIVE}"><img alt="Live app" src="https://img.shields.io/badge/live%20app-testnet-1BB3A2" /></a>
  <a href="https://github.com/0xkinno/kedge/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/0xkinno/kedge/actions/workflows/ci.yml/badge.svg" /></a>
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue" />
</p>

> When a seafarer's phone goes overboard, Kedge lets his crew and family bring his wallet back, using Portaldot's built-in Recovery pallet, signed from the MetaMask he already has.

**A wallet your crew can bring back, and no single person can take.**

![Kedge landing page](docs/screens/landing.png)

At 03:40 off Singapore, Ramon's phone slips over the side with his wages on it. His wife Lorna and his bosun Ben confirm on a call that it is really him, approve from their own wallets, and after a safety delay his new phone brings home his tPOT, his native asset and the savings his allotment contract holds, with one signature. All of it runs on the Portaldot V3 testnet today, and every number below comes from receipts you can re-read yourself.

| | |
|---|---|
| **Live app** | ${LIVE} (no login) |
| **For judges** | [\`/judge\`](${LIVE}/judge): a 60-second, 3-minute and 10-minute walk |
| **Run a rescue** | [\`/drill\`](${LIVE}/drill): a full rescue on the live testnet in about two minutes |
| **Verify it yourself** | [\`/proof\`](${LIVE}/proof) decodes every recorded transaction in your browser; \`npm run verify\` re-reads ${f.txs.length} of them from the public node with no key |
| **Demo video** | ${video ? video : 'link added at upload (2 min 50 s)'} |
| **Pitch deck** | [docs/kedge-deck.pdf](docs/kedge-deck.pdf) |
| **Kedge Kit** | [packages/kedge-kit](packages/kedge-kit): add recovery to your own Portaldot dApp (in this repository; not published to npm) |
| **Track** | Ecosystem DApps |
| **Built on** | Portaldot V3: Recovery, Utility, Assets with the ERC-20 precompile, Revive, the pallets address |
| **Measured** | ${S.asExpected} of ${S.total} scenarios as expected; ${m.rescuesCompleted} of ${m.rescuesAttempted} rescues completed; ${m.attacksStopped} of ${m.attacksTried} attacks stopped; **${m.legitimateRescuesWronglyBlocked}** honest rescues wrongly blocked; ${fmtTpot(m.costPerRescueTPOT)} tPOT in fees per rescue |

<table>
<tr><td width="50%"><img src="docs/screens/harbour.png" alt="Harbour: name your crew, make a Lifeboat key, see what it costs" /><br /><sub><b>Harbour.</b> The owner names a crew, makes a passphrase-locked key for a new phone, and sees the cost before signing.</sub></td>
<td width="50%"><img src="docs/screens/crew.png" alt="Crew door: a guardian types four words before approve unlocks" /><br /><sub><b>Crew door.</b> A guardian hears four words on a call and types them. Approve stays locked until they match.</sub></td></tr>
<tr><td><img src="docs/screens/rescue.png" alt="Rescue: timeline, delay clock, what will move" /><br /><sub><b>Rescue.</b> Timeline, delay clock in blocks, and a dry run of every item: will move, or will not move and why.</sub></td>
<td><img src="docs/screens/proof.png" alt="Proof: every recorded transaction decoded in the browser" /><br /><sub><b>Proof.</b> Every recorded transaction, decoded in your browser from the public node.</sub></td></tr>
</table>

## The problem

Ramon Dizon, 34, is an able seaman from Iloilo, seven months into a nine-month contract on a bulk carrier. His wages and savings sit in a wallet on his phone. His seed phrase is on a scrap of paper in a drawer at home, or nowhere. Tonight, during a mooring operation, the phone slips out of his coverall pocket and goes over the side. Port wifi is nine days away; his next allotment to Lorna is due in twelve. A seed-phrase wallet has no "forgot password", custodial apps want identity checks from a ship with no signal, and a company-run seed backup means handing his keys to a company. (Ramon, Lorna, Ben and Ana are illustrative characters; the mechanism and every transaction are real.)

| What is true | Source |
|---|---|
${sourceRows}

Exact quotes, dates and caveats are in [docs/sources.json](docs/sources.json); \`npm run verify:sources\` re-checks them against the live pages.

## The solution

1. **Name the crew.** From MetaMask, Ramon picks guardians (Lorna, Ben, Ana), how many must agree, the safety delay, and the wallet on a new phone. It costs only a fee.
2. **Keep the Lifeboat Card.** A wallet-size PDF holds his new key, locked with a passphrase only he knows. Alone it cannot move a cent.
3. **Call, hear, type.** The guardians are the eyes and judgment. When Ramon calls from the ship, his new phone shows four words derived from (lost wallet, new wallet, group, chain). Lorna types them; **approve stays disabled until they match**. A scam link that names a different new wallet produces different words.
4. **Wait.** Two approvals start the delay. Ramon gets one alert per attempt, and while he still holds his phone he can stop it or slash the starter.
5. **Bring it home.** His new phone finishes the attempt and signs once. A single \`force_batch\` pays out the vault, moves the native asset, then sweeps the coin. If one item fails, the rest still move and the receipt shows exactly which.

**What always gets through:** an attempt Ramon did not start reaches him as an alert, and he can cancel it. A second family group, set once, can outrank the crew if he never comes home.

## Explore it in 2 minutes

1. Open [\`/drill\`](${LIVE}/drill) and press **Start the drill**. House crew keys run a full rescue on the live testnet.
2. Watch the safety delay count down in blocks.
3. Read the receipt: each item has its own status and an explorer link.
4. Open [\`/proof\`](${LIVE}/proof), filter to **A3**, press **Check**. Your browser reads the block from the public node and decodes \`recovery.NotYetInheritable\`, a rescue the chain refused for coming too early.
5. Click the explorer link on that row to see the same failed extrinsic on the block explorer.

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

\`\`\`
 Ramon's MetaMask   Lorna     Ben     Ramon's new phone
        |             |        |             |
        v             v        v             v
   Ethereum tx to the Portaldot pallets address (0x6d6f...0000)
 set_friend_groups  initiate  approve   finish + control_inherited_account
        '-------------+--------+-------------'
                      v
              Recovery pallet (native)
                      | Signed(Ramon's old account)
                      v
            utility.force_batch([ ... ])
    +---------------+----------------+-------------------------+
    v               v                v
 balances: tPOT  assets: kUSD   revive.call: AllotmentVault
                                (msg.sender = Ramon's old 0x address)
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

No model sits anywhere in the money path. All of the engine modules live in one place, the [Kedge Kit](packages/kedge-kit), and the app imports them from there.

## Product flow

\`\`\`mermaid
sequenceDiagram
  autonumber
  actor Ramon
  actor Lorna
  actor Ben
  participant Kedge as Kedge app
  participant Chain as Portaldot V3
  Ramon->>Kedge: Name guardians, print the Lifeboat Card
  Kedge->>Chain: recovery.set_friend_groups (MetaMask, pallets address)
  Note over Ramon: 03:40, phone overboard
  Ramon->>Lorna: Satellite call, reads the four words from his new phone
  Lorna->>Kedge: Types the words, starts the attempt
  Kedge->>Chain: recovery.initiate_attempt (Lorna's wallet)
  Chain-->>Ramon: Watchkeeper alert on Telegram
  Ben->>Kedge: Types the words, approves
  Kedge->>Chain: recovery.approve_attempt (Ben's wallet)
  Note over Chain: safety delay (72 h real, 10 blocks in a drill)
  Ramon->>Kedge: New phone: Bring it home
  Kedge->>Chain: finish_attempt, then control_inherited_account(force_batch[...])
  Chain-->>Kedge: RecoveredAccountControlled and one event per item
  Kedge-->>Ramon: Receipt: what moved, what did not, with explorer links
\`\`\`

## Why this needs Portaldot

Portaldot V3 is the hero of this build. Every MetaMask address has a native **twin account** (\`h160\` followed by twelve \`0xEE\` bytes, verified against the chain). An Ethereum transaction to the runtime **pallets address** is dispatched as a native call signed by that twin, so a plain MetaMask address can use the chain's **Recovery pallet** (the friend-group version, with priorities, delays and a cancel window). When the inheritor runs \`revive.call\` inside \`control_inherited_account\`, a Solidity contract sees the **old address** as \`msg.sender\`, so the vault pays out. Native assets are reached from Solidity through the **ERC-20 precompile**, and the whole sweep moves in one \`utility.force_batch\`. Measured in [PLATFORM_PROBE.md](PLATFORM_PROBE.md); the reasoning is in [DISCOVERY.md](DISCOVERY.md).

**Delete test:** remove Portaldot's Recovery pallet and step 5 fails, because there is no inheritor and no way to act as the lost account.

## Why this is different

| Approach | Who can move the money | What it costs the user | Weak point |
|---|---|---|---|
| Seed phrase on paper | anyone who finds it | nothing | lost paper means lost wallet; found paper means stolen wallet |
| Company-held seed backup | the company, a court order, a breach | a subscription and an identity check | custody by another name, and it needs a signal and a camera |
| Smart-contract wallet with guardians | guardians, through a contract | a new wallet and a migration | you must change wallets **before** the loss, and each chain needs its own |
| Exchange custody | the exchange | fees and KYC | one founder, one server: a single point of failure |
| **Kedge on Portaldot** | **two of your guardians, after a delay you set, and you can still cancel** | **${fmtTpot(m.costPerProtectionTPOT)} tPOT to protect, ${fmtTpot(m.costPerRescueTPOT)} tPOT to rescue** | no new wallet; the Recovery pallet is the chain's own, and the rescue reaches money held in Solidity contracts |

A rescue that only moved native coins would leave a seafarer's savings stranded in contracts. Kedge's sweep also pays out a Solidity vault that only the old address could withdraw from, because the chain lets the rescuer call it **as** that address.

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

### What it will not do

| Refusal | Where | Backed by |
|---|---|---|
| Name a contract as the inheritor | \`mate.ts\` | probe part 8: a contract calling the pallets address does nothing |
| List guardians unsorted or twice | \`mate.ts\`, \`purser.ts\` | chain \`FriendsNotSortedOrUnique\`, even with our check disabled (\`KEDGE_SABOTAGE=sort\`) |
| Rescue before the delay | \`mate.ts\` | A3 |
| Approve without the phrase | Crew door | A12 (advisory) |
| Move an item that would fail | \`survey.ts\` | A10 |
| Run a drill when the kill switch is on or keys are missing | \`/api/drill\` | HTTP 503 with a plain message |

## Measured

Both directions are reported, **and the second number is the one that matters.** Money figures are rounded here; exact values are in \`docs/FACTS.json\`.

| | |
|---|---|
| All scenarios | ${S.asExpected} of ${S.total} as expected: ${C.onChainHappy.of} on-chain happy paths (${C.onChainHappy.ids.join(', ')}), ${C.onChainRefused.of} on-chain refusals with a decoded error (${C.onChainRefused.ids.join(', ')}), ${C.onChainBehaviour.of} on-chain behaviours (${C.onChainBehaviour.ids.join(', ')}), ${C.uiRefused.of} guard refusals (${C.uiRefused.ids.join(', ')}), ${C.counterfactual.of} counterfactuals (${C.counterfactual.ids.join(', ')}) |
| Rescues completed / attempted (curated campaign) | ${m.rescuesCompleted} of ${m.rescuesAttempted} (one with a guardian on a native sr25519 wallet) |
| Attacks stopped | ${m.attacksStopped} of ${m.attacksTried}: ${C.onChainRefused.asExpected} refused on chain and ${C.uiRefused.asExpected} stopped by pre-flight guards |
| Honest rescues wrongly blocked | ${m.legitimateRescuesWronglyBlocked} |
| Cost to protect | ${fmtTpot(m.costPerProtectionTPOT)} tPOT fee, ${m.friendGroupDepositTPOT} deposit |
| Cost per rescue | ${fmtTpot(m.costPerRescueTPOT)} tPOT in fees |
| Contract storage deposit refunded in the sweep | ${fmtTpot(m.storageDepositRefundTPOT)} tPOT |
| Safety delay | ${m.delayBlocks} blocks, measured ${m.delaySecondsMeasured} s |
| Public drills | ${drillLine}; a second request during a run is refused (HTTP 409) |
| Unattended alert | ${f.watch.unattendedDelivered ? 'a Telegram alert delivered by the GitHub Actions Watchkeeper (started by a manual dispatch of the workflow; screenshot in `docs/demo/telegram-alert.png`)' : 'not yet delivered'} |
| Real-people drill | ${rp} |
| Browser end-to-end | ${trAll ? `${trPass} of ${trAll} steps passed against the live site` : 'not run'} |

| Id | Scenario | Result | Observed | Proof |
|---|---|---|---|---|
${scen}

**Misses and surprises.** We predicted \`AlreadyVoted\` for a double approval; the chain says \`AlreadyApproved\` (A4), and the pass criterion was amended openly. Our first campaign run read refused calls as successes until we found the \`EthExtrinsicRevert\` shape. A5 removed the attempt but burned nothing. Each is in [docs/FINDINGS.md](docs/FINDINGS.md).

## Testnet deployment

| Contract | Address | Deploy tx | Block | Size | Cost |
|---|---|---|---|---|---|
| AllotmentVault (Solidity) | \`${dep.address}\` | \`${dep.txHash}\` | ${bl(dep.block)} | 997 bytes runtime | ${fmtTpot(dep.costTPOT)} tPOT |
| SenderProbe (throwaway probe) | \`${probes.SenderProbe.address}\` | \`${probes.SenderProbe.txHash}\` | ${bl(probes.SenderProbe.block)} | 183 bytes runtime | ${fmtTpot(probes.SenderProbe.costTPOT)} tPOT |
| Caller (throwaway probe) | \`${probes.Caller.address}\` | \`${probes.Caller.txHash}\` | ${bl(probes.Caller.block)} | 396 bytes runtime | ${fmtTpot(probes.Caller.costTPOT)} tPOT |

The vault's token is Kedge's own native test asset **kUSD** (asset ${dep.tokenAssetId}) through the ERC-20 precompile \`${dep.token}\`. Deployed runtime bytecode equals the compiled artifact, with the immutable slot patched. Every scenario transaction:

<details><summary>${f.txs.length} transactions (open to list them)</summary>

| Scenario | Step | Result | Block | Tx |
|---|---|---|---|---|
${txRows}

</details>

The same table, with full hashes, is generated in [EVIDENCE.md](EVIDENCE.md).

## The browser test: real signing, real chain

\`e2e/wallet.mjs\` drives headless Chromium through every screen against the live site. An EIP-1193 provider is injected into the page and backed by a real key held by the test process, so each transaction is **signed and sent to the live testnet**: connect, switch chain, sign a message for alerts, protect a wallet, read the four words on the new phone, lock and unlock the guardian gate, approve, wait out the delay, bring it home, stop and slash from the alert link, the deep-link door, the Family and Crew groups, decode a refused attack on \`/proof\`, the tour, a drill, and a phone-width pass. Recordings and screenshots: \`docs/demo/deployed-run/\`.

${tr ? tr.results.map((r) => `- ${r.ok ? 'pass' : 'FAIL'}: ${r.step}`).join('\n') : ''}

This is an injected test wallet, **not** the Rabby or SubWallet extension: it proves the app's wallet paths against real signatures.

## Findings on Portaldot V3

Measured on the live testnet before anything was built, with hashes in [PLATFORM_PROBE.md](PLATFORM_PROBE.md) and the full friction report in [docs/FINDINGS.md](docs/FINDINGS.md).

- **A MetaMask address can drive the Recovery pallet.** Owner, guardians and inheritor completed the whole lifecycle with plain Ethereum transactions to the pallets address.
- **\`msg.sender\` is the lost address.** Inside \`control_inherited_account\`, a \`revive.call\` runs the contract with the old address as the caller (probe part 7).
- **A contract cannot be the rescuer.** A Solidity contract calling the pallets address returns success with no effect, so Kedge refuses a contract as the inheritor.
- **Receipts lie in two different ways.** A refused Recovery call is an extrinsic success plus \`revive.EthExtrinsicRevert\` with receipt status 0. A failed inner call inside \`control_inherited_account\` leaves receipt status **1** and shows only in \`RecoveredAccountControlled.call_result\`. The Helmsman matches the extrinsic by \`keccak256(payload) == eth tx hash\` and reads the events.
- **The vault gives its storage deposit back.** The sweep returned ${fmtTpot(m.storageDepositRefundTPOT)} tPOT, because withdrawing zeroes the slot.
- **The security deposit on this testnet is 0.** Slashing removes an attempt but burns nothing, so the deterrent is two guardians, the delay and the owner's cancel.
- **The error name was not the one we predicted** (\`AlreadyApproved\`, not \`AlreadyVoted\`), and \`eth_estimateGas\` returns the decoded error inside \`info.error.message\`.

## Judging criteria map

| Criterion (weight) | Exact words | Where to look |
|---|---|---|
| Technical Feasibility (30%) | "technical approach, system architecture, code completeness, and actual delivery"; "whether GitHub shows genuine and sustained development activity"; "deployed on Portaldot testnet with verifiable on-chain interactions" | \`npm run verify\` and [EVIDENCE.md](EVIDENCE.md) (${f.txs.length} transactions); [\`/proof\`](${LIVE}/proof); the commit history (${ncommits} commits, ${first[1]} to ${last[1]}); [vault deploy block ${dep.block}](${E(dep.block)}) |
| Innovation (30%) | "effective use of Portaldot V3 features such as WASM/EVM compatibility, modular architecture, and multi-chain capabilities"; "real value beyond existing solutions" | [DISCOVERY.md](DISCOVERY.md); [SDK_SURFACE.md](SDK_SURFACE.md): EVM, the Recovery pallet, Utility and native assets in one rescue; [block 317779](${E(317779)}) (\`msg.sender\` is the lost address) |
| Ecosystem Contribution (20%) | "contribution to Portaldot infrastructure, developer tools, node ecosystem, application ecosystem, and user growth"; "potential for sustained building, open-source value" | [Kedge Kit](packages/kedge-kit) and the \`/protect\` deep link other dApps can use; [docs/FINDINGS.md](docs/FINDINGS.md) (first public Recovery measurements on V3); \`packages/kedge-kit/src/scale.mjs\` (open dependency-free encoder) |
| Business Potential (20%) | "real market needs"; "target users and use cases are clear"; "business model and growth path are feasible" | the sourced numbers above; [THESIS.md](THESIS.md); *Business and what comes next* below |

## Run it yourself

\`\`\`bash
git clone https://github.com/0xkinno/kedge && cd kedge
npm ci
npm run verify        # keyless: re-reads every recorded transaction from the public node
npm test              # unit, encoder and live-chain tests
(cd contracts && forge test)
(cd packages/kedge-kit && npm ci && npm run build && npm test)
cd apps/web && npm ci && npx next build && npx next start -p 3100
BASE=http://localhost:3100 node ../../e2e/wallet.mjs     # the full wallet journey, signs on testnet
\`\`\`

Env (server only): \`DRILL_RAMON_PK\`, \`DRILL_LORNA_PK\`, \`DRILL_BEN_PK\`, \`DRILL_LIFEBOAT_PK\` (testnet-only), \`UPSTASH_REDIS_REST_URL\`, \`UPSTASH_REDIS_REST_TOKEN\`, \`TELEGRAM_BOT_TOKEN\`, \`DRILL_KILL\`. \`scripts/keygen.mjs\` writes keys to the gitignored \`keys/\`; \`scripts/keys_restore.mjs\` rebuilds them from \`.env.local\`.

### Where the numbers come from

Nothing headline is typed. \`scripts/facts.mjs\` builds [docs/FACTS.json](docs/FACTS.json) from receipts and classifies every scenario once; the landing page, this README, the deck and the docs read it, and tests fail on drift. Market figures are in [docs/sources.json](docs/sources.json) with exact quotes that \`npm run verify:sources\` re-checks.

## Ecosystem: the Kedge Kit

The engine that runs this app is a package other Portaldot dApps can use: \`twinOf\`, the call builders, \`sendRuntimeCall\`, \`resolveOutcome\`, the refusals and a dependency-free encoder, with ${kitTests} test file(s) and a CI job. Two examples are in [packages/kedge-kit/README.md](packages/kedge-kit/README.md): protect the connected MetaMask account with two guardians, and read the true outcome of a rescue. A dApp can also link to \`${LIVE}/protect?app=<name>&return=<https url>\` to send an owner to Harbour, pre-filled, and get them back after they sign.

## Business and what comes next

Free for individuals. Manning agencies and seafarer welfare groups reach crews at scale; wallet makers can embed the protection flow, because every Portaldot account is recoverable the same way. The same mechanism with a higher-priority Family group and a long delay is inheritance if Ramon never comes home. Next: a real-people drill with consenting guardians, an agency pilot, and deploying the ink! vault so a single rescue spans both contract VMs.

## Limits, stated plainly

- The security deposit is 0 on this testnet, so slashing is a signal, not a penalty.
- An ink! (WASM) vault is written and unit-tested (\`ink/allotment_ink\`) but **not deployed**: this chain charges 0.06 tPOT per byte of contract code, about 295 tPOT for 4.9 KB, which the testnet budget did not cover. The "WASM" half of WASM/EVM is therefore not shown on chain.
- The public drill is signed by **house crew keys**, which are testnet-only, capped, and labelled on every screen.
- The four-word phrase is advisory UI; the chain enforces the approval count and the delay.
- The demo token is Kedge's own **kUSD** (asset ${dep.tokenAssetId}). The pUSD pool held about 127 pUSD, too thin to demo with.
- Wallet paths are proven with an injected test wallet backed by real signing, not yet with the Rabby or SubWallet extensions or MetaMask mobile.
- Testnet only. Not audited.

## Docs

[EVIDENCE](EVIDENCE.md) · [PROOF](PROOF.md) · [FINDINGS](docs/FINDINGS.md) · [PLATFORM_PROBE](PLATFORM_PROBE.md) · [DISCOVERY](DISCOVERY.md) · [SDK_SURFACE](SDK_SURFACE.md) · [RISK](RISK.md) · [THESIS](THESIS.md) · [MOMENT](MOMENT.md) · [DESIGN](DESIGN.md) · [JUDGE](JUDGE.md) · [PROGRESS](PROGRESS.md) · [MILESTONES](MILESTONES.md) · [REDTEAM_LOG](REDTEAM_LOG.md)

## Disclosures

**Build dates.** Research and design happened before Nov 4 2026. Code was written from Nov 4 2026 onward: ${ncommits} commits, ${first[0]} (${first[1]}) to ${last[0]} (${last[1]}), all authored by 0xkinno. **AI assistance:** Claude Code drafted much of the code and docs under the author's direction and review. The hero image is AI-generated. Third-party: ethers, polkadot.js, Next.js, Foundry's forge-std, solc-js, the BIP39 English word list (the call phrase). The persona names and the pitch voice are illustrative.

## License

MIT
`;
writeFileSync('README.md', readme);
const log = execSync("git log --reverse --format='%h|%ad|%s' --date=short", { encoding: 'utf8' }).trim().split('\n').map((l) => l.split('|'));
writeFileSync('MILESTONES.md', `# MILESTONES\n\nGenerated from git history by \`node scripts/readme_gen.mjs\`. Transaction hashes are in EVIDENCE.md.\n\n| Date | Commit | What |\n|---|---|---|\n${log.map(([h, d, ...s]) => `| ${d} | \`${h}\` | ${s.join('|')} |`).join('\n')}\n\nKey chain milestones: vault deployed at block ${dep.block}; headline mechanism proven at block 317779 (PLATFORM_PROBE part 7); campaign blocks in EVIDENCE.md.\n`);
console.log('README.md and MILESTONES.md written');
