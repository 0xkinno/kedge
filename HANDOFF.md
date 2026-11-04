# HANDOFF (written after commit 4bfab93, 2026-11-04 evening WAT)

For the next agent. Read this, then `reference/KEDGE_BUILD_INSTRUCTION.md` and `reference/KEDGE_UPGRADE_2.md` (both gitignored, supplied by Kinnoski). Same rules: 0xkinno is the only author, no AI trailers, no sample-project names in committed files, house style (no emoji, no em or en dashes, no hype words), numbers only from `docs/FACTS.json`, never squash or rewrite history.

## Where things are
| Thing | Value |
|---|---|
| Repo | https://github.com/0xkinno/kedge (public), branch `main` |
| Live app | https://kedge-kinnoskis-projects.vercel.app (Vercel project `kedge`, id `prj_cb43ytmhBU4BnyWRd1feTZ5uWZ5I`, team `team_sVyjRdkD8GtLSBSLzikfErzn`, root dir `apps/web`, Node 22, auto-deploys every push) |
| Vault (Solidity) | `0x92cD058Cb7E4d69476bFc7Cbb7630C50f13B57D4`, native test asset kUSD id 20261104 |
| Chain | Portaldot V3 testnet, chain id 420420777, spec 3002 |
| Telegram | bot `@KedgeBot`; Kinnoski's chat id 1676349577 |
| Secrets | GitHub Actions: `TELEGRAM_BOT_TOKEN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. Vercel env (sensitive): the four `DRILL_*_PK`, the Upstash pair, `DRILL_KILL=0`. **No secret is in the repo.** Ask Kinnoski for any value; never print or commit one |
| Keys | `keys/` is gitignored and existed only in the previous cloud container. The deployer wallet (EVM `0x9db1ac0Ce3dabD203D23C46fDc064F9FbFe68Eb2`, native `5FdU9vdJ46iMDxsJpibR43ke2iAvGg23Req12e2P4qJtFGXa`) held about 212 tPOT. Its key is not recoverable by you. Generate a new deployer with `node scripts/keygen.mjs deployer-2` and ask Kinnoski to fund it. Testnet addresses of the cast (lorna, ben, ana, lifeboat, ramon, drill-*) are in `deployments/` and the evidence files; the drill keys live in Vercel |

## Done and verified (do not redo)
Phases 0 to 13 of `TASK.md` (kept in `reference/TASK.md`), plus: landing redesign with the hero photograph placed per the brief, Harbour step cards, live chain strip, Vercel deploy, `npm run verify` (31 of 31 transactions), `npm test` green, Playwright 63 of 63, Lighthouse four pages 97 to 99 (home 91 to 95 in the lab while the browser observes LCP at 170 ms), the wallet journey `e2e/wallet.mjs` 12 of 12 against the live URL (recordings in `docs/demo/deployed-run/`), the Watchkeeper unattended alert (below), and the ink! contract written, tested (5 tests) and built (4.9 KB) but NOT deployed (budget, below).

## Telegram unattended alert (UPGRADE_2 U4): mostly done
- GitHub Actions run 41928527039 (a `workflow_dispatch` of `watchkeeper.yml`) detected an attempt at block 326458 and wrote the dedupe key `kedge:sent:326458:4:initiated` just before sending. Evidence: `evidence/watch/unattended-run.json`.
- **Still needed from Kinnoski:** a screenshot of the received Telegram message, saved as `docs/demo/telegram-alert.png`. Then set `watch.unattendedDelivered: true` in `scripts/facts.mjs` and regenerate FACTS and the README. State honestly that the run was started by `workflow_dispatch`, not by the hourly schedule; if a scheduled run later delivers one, record that too.
- The workflow had a runaway bug (a failing run re-dispatched itself every 30 s). Fixed: it chains only `if: success()`. Cause of the failures: the GitHub secrets were saved with literal quotes; `watch/store.mjs` now strips them. Tell Kinnoski to re-enter the secrets without quotes anyway.
- The classifier blocked disabling workflows or cancelling runs through the API. Do not bypass it; ask Kinnoski to do that in the Actions tab if needed.

## What remains, in this order
1. **UPGRADE_2 U7 Kedge Kit** (`packages/kedge-kit`, tsup, the web app imports from it, `/protect` deep link, kit README, tests). It is the only new code module. Land it in small commits **before Nov 5, 05:00 WAT**; after that only docs, evidence, fixes and drill records.
2. **U1, U2, U3** (consistency and figures, sponsor-flaw placement, README to the required order). Known facts for U1: the README scenarios badge is hand-written and says "11/11"; FACTS has 16 scenarios. Classify them (`onChainHappy` H1 H2; `onChainRefused` A1 A2 A3 A4 A6 A9; `onChainBehaviour` A5 A7 A8 A10; `uiRefused` A11 A12; `counterfactual` C1 C2) and derive every total and the badge from that block. Add `fmtTpot`.
3. U4 screenshot step (above); U5 live drills spread across Nov 5 (each drill writes `docs/drills/*.json`; run them from the public `/drill` page at different hours, not in a loop); U6 real-people drill (`docs/REAL_PEOPLE_DRILL.md`; needs Kinnoski and 2 to 3 people); U8 inheritance preset in Harbour (check first, it may exist); U9 final pass and red team on the deployed URL.
4. **The demo film** (below).
5. Kinnoski submits on DoraHacks, then tag `v1.0-submitted`. Code freeze Nov 6, 05:00 WAT.

## Budget and the ink! contract
This chain charges 0.06 tPOT per byte of contract code. `ink/allotment_ink` is 4.9 KB, so deployment needs about 295 tPOT. UPGRADE_2 says do not deploy it and do not claim WASM on chain: keep it that way unless Kinnoski funds about 100 tPOT more and says so. `scripts/ink_deploy.mjs` dry-runs first and refuses above a cap. Toolchain: Rust 1.85 pinned in `rust-toolchain.toml` with clippy, `cargo-contract` 5.0.3, ink 5.1.1 (V3 runs `pallet-contracts`, not ink 6).

## Gotchas learned
- `pkill -f` and `pgrep -f` with a pattern that appears in your own command line kill your shell. Use `pgrep -f "[n]ext-server"`.
- Vercel installs only `apps/web`. Shared code in `../../watch` must resolve bare imports from `apps/web/node_modules` (done in `next.config.mjs`). Vercel blocks vulnerable Next versions (now 15.5.29). Vercel turns deployment protection on by default; it is off so the site is public.
- The Vercel MCP needs a one-time team grant through `authorize_team_access` (a link Kinnoski opens). Sensitive env values cannot be read back.
- `next/font` Google fetch fails intermittently at build time; retry.
- A failed Recovery call is `ExtrinsicSuccess` plus `revive.EthExtrinsicRevert` with receipt status 0; a failed inner call in `control_inherited_account` leaves status 1. Always decode events (`helm.ts`).
- `eth_estimateGas` hides the decoded error in `info.error.message`.
- Never let a workflow re-dispatch itself with `if: always()`.
- TypeScript 7 breaks Next's type check (`apps/web` pins 5.9.3). `motion-dom` is pinned to 12.23.12.
- The pUSD pool is too thin to buy from (about 127 pUSD); the demo asset is kUSD.

## The film (Kinnoski's brief, summarised)
Output: MP4, 2:50 total, voice-over 2:40 (if the film is shorter than the voice-over, extend the film), 30 to 45 MB, quality for X and YouTube. Every file must live in `reference/video/` (gitignored), nothing video-related anywhere else. Use the `hackathon-film-pipeline` skill on Kinnoski's machine (`users/hp/.claude/skills/hackathon-film-pipeline`). Look: a premium motion-design showreel in Kedge's own palette (paper `#F6F1E7`, ink `#0C2536`, deep-water `#123B52`, lifejacket `#FF5A1F`, sea-glass `#1BB3A2`, brass `#B88A2E`) and type (Bricolage Grotesque, Instrument Serif, Hanken Grotesk, JetBrains Mono). Original, not a copy of the reference films Kinnoski shared (they show a full-screen browser recording with a cursor and zooms, a laptop frame cut-out, a big headline with floating glass cards, a clock, and a phone mockup). Needed: a designed intro; the live site full-screen laptop style with a visible cursor, scrolling, zoom in and out, and a wallet connected; Harbour, Crew, Rescue, Proof, Drill; an SVG phone doing the Telegram alert; a refused-attack proof; smooth card transitions; a designed outro. No overlap, no empty space, no glitches. Check every scene in Playwright Chromium before the final render. Voice: human and clear, tells the story with the names (Ramon, Lorna, Ben, Ana), never says "fictional", covers all four judging criteria.
Raw material already recorded: `docs/demo/deployed-run/*.webm` (the 12-step journey on the live site), `docs/demo/tour-silent.webm`, `docs/screens/*.png`, `docs/brand/kedge-banner.png`. For fresh full-page cursor recordings use Playwright `recordVideo` at 1920x1080 against the live URL with a visible cursor overlay and the injected wallet from `e2e/wallet.mjs`.

### Voice-over draft (about 330 words; extend to about 400 for 2:40 and tighten to taste)
Three forty in the morning, off Singapore. Ramon's phone slips over the side. His wages were on it.

On most chains, that wallet is gone. A seed phrase has no forgot-password. Custodial apps want a signal and a camera. A company-held backup means handing your keys to someone else. About one point eight nine million seafarers work the world's ships, and Filipino sea-based workers alone sent home more than seven billion dollars last year.

This is Kedge, built on Portaldot V3. Before the voyage, Ramon opens Harbour, connects the MetaMask he already has, and names his crew: Lorna, Ben and Ana. Two of three must agree. He sets a safety delay and prints a Lifeboat Card: a new key, locked with a passphrase only he knows.

Now the phone is gone. Lorna calls him on the ship's line. His new phone shows four words. She types them. If a scammer sent her a different link, the words would not match, and approve would stay locked. She starts the attempt. Ben approves. Ramon gets an alert on Telegram, and could stop it while he still holds his phone.

After the delay, one signature from his new phone brings everything home: his coin, his native asset, and the savings his allotment contract held, paid out because the chain lets the rescuer call it as his old address. The receipt shows every item.

Every claim is on chain. Two rescues completed, every attack stopped with a decoded refusal, and no honest rescue blocked. Open Proof, press Check, and your own browser decodes the failed transaction.

Why Portaldot? Every MetaMask address has a native twin. A MetaMask transaction to the pallets address drives the Recovery pallet, and a Solidity vault sees the old address as the sender. Remove Portaldot and step five fails. Real use of V3's EVM and native modules, a measured findings report, and an open encoder other apps can reuse.

The market is real: seafarers and their families, reached through manning agencies and welfare groups, free for individuals. Kedge. Lose the phone, not the wages.

Before recording: check each number against `docs/FACTS.json`; do not say "Telegram alert" until Kinnoski confirms the screenshot; do not describe the ink! contract as deployed.

### Scene plan (2:50)
0:00 cold open: the 03:40 clock and a phone-overboard SVG. 0:12 the problem and sourced numbers. 0:30 landing page full screen: scroll, zoom on the Rescue Card and the rope to the anchor. 0:48 Harbour with a wallet connected: crew, Lifeboat key and card. 1:10 Crew door: four words, locked then unlocked approve; an SVG phone with the Telegram alert. 1:35 Rescue: delay clock, one-signature bring it home, per-item receipt. 2:00 Proof: a refused attack decoded, the measured numbers, `npm run verify`. 2:20 Why Portaldot, the kit, business. 2:40 outro with the URL and the repo.

## Prompt for the next agent (Kinnoski: paste this)
"Read HANDOFF.md in the repo root, then reference/KEDGE_BUILD_INSTRUCTION.md and reference/KEDGE_UPGRADE_2.md. Continue from commit 4bfab93 on 0xkinno/kedge. Do UPGRADE_2 U7 first in small commits, then U1, U2, U3, and stop at each GATE to report. Keep 0xkinno as the only author. Then produce the film described in HANDOFF.md using my hackathon-film-pipeline skill, with every output in reference/video/. Ask me for the Telegram screenshot (docs/demo/telegram-alert.png), tPOT funding, and anything else you cannot get yourself. Never print or commit secrets."
