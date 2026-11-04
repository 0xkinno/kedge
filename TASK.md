# TASK.md: Kedge

Work top to bottom. Each phase depends on the one before. Mark `[x]` only when the item is done **and**
verified (command output, tx hash, screenshot or passing test recorded). Commit after every completed item
group with a real message, authored by 0xkinno only. Stop and report to Kinnoski at every **GATE**.

Source of truth: `reference/KEDGE_BUILD_INSTRUCTION.md` (section numbers below refer to it) and
`HACKATHON_WINNING_SYSTEM_V5.md`.

---

## Phase 0. Repo, identity, guards
- [x] Create public repo `0xkinno/kedge`; clone locally (https://github.com/0xkinno/kedge exists, local clone at kedge/ with origin set)
- [x] `git config user.name "0xkinno"` and `user.email` (Section 14.1); verify with `git config --list` (git config --local shows user.name 0xkinno, user.email 0xkinno@users.noreply.github.com placeholder; replace with the real GitHub email before the first push)
- [x] `.claude/settings.json` with empty attribution (14.2)
- [x] `.githooks/commit-msg` + `git config core.hooksPath .githooks` (14.3); test it strips a fake trailer (fake trailer test: Claude trailers stripped; spec regex fixed because it missed 'Co-Authored-By: Claude ... <noreply@anthropic.com>'; a real commit carrying the trailers logged clean)
- [x] `.github/workflows/no-claude-attribution.yml` (14.4); confirm it passes on the first push (passed on first push, run on 80564fd)
- [x] `.gitignore` per 14.6; confirm `reference/` and `keys/` are ignored (`git check-ignore -v`) (git check-ignore -v shows reference/ and keys/ ignored; git ls-files lists neither)
- [x] Move this instruction file and TASK.md source into `reference/`; copy TASK.md to repo root (both files in reference/, TASK.md copied to root)
- [x] Clone reference repos (Section 16) into `reference/repos/` (20 directories: 18 samples, V3 guide, polkadot-sdk sparse)
- [x] `scripts/check_copy.mjs`: fails on emoji, em/en dashes, hype words, and any sample-project name outside `reference/`; wired into CI (negative test trips emoji, dash, hype word, sample-name hash; ci.yml runs it, CI run pending the repo)
- [x] First commit and push: "chore: scaffold, identity guards, copy checks" (pushed to origin/main; GitHub shows 0xkinno as author of all commits; CI and attribution gate both green)

## Phase 1. G0 and G1 (rules, lanes, sponsor intel)
- [x] `RULES_EXTRACT.md` from Section 2 (verbatim criteria, tracks, dates in WAT, DoraHacks fields, code-compliance rules) (from the announcement; DoraHacks page not fetchable (405), flagged inside the file)
- [x] `reference/LANE_MAP.md` from Section 3 plus anything new found in Discord / DoraHacks gallery (V5 22.8) (grep of all clones: no sample sends to Recovery; Discord and DoraHacks gallery not checked, flagged)
- [x] `SPONSOR_INTEL.md` from Section 4: founder primitive, newest releases, depth ladder, availability; link the upstream Recovery PR and its date (live metadata checked; upstream PR paritytech/polkadot-sdk#10482, commit dated 2026-05-01; finding: SecurityDeposit = 0)
- [ ] **GATE 1:** report to Kinnoski: lane confirmed empty, any new rival in the Recovery lane

## Phase 2. G2 (the moment) and sources
- [x] `MOMENT.md` from Section 5 (from Section 5, persona and clock, caveats on each source)
- [x] Verify every source in the pain table; write `docs/sources.json` (url, title, quote, date opened) (8 quotes re-checked against live pages by scripts/verify_sources.mjs; 3 caveats recorded in sources.json)
- [x] Test asserting the landing-page money figure equals `sources.json` (tests/sources.test.mjs; tampering the figure makes it fail, restoring passes)
- [ ] Founder-stake line approved by Kinnoski

## Phase 3. G3 and G5 (discovery probes on the live chain)  <- the build lives or dies here
- [ ] `scripts/keygen.mjs`: testnet keys for ramon, lorna, ben, ana, lifeboat, stranger, drill crew; addresses printed only
- [ ] **GATE 3a:** give Kinnoski the funding list (addresses, amounts from live estimates); wait for funds
- [ ] `scripts/probe.mjs` part 1: spec name/version, genesis, decimals, ED, NativeToEthRatio, gas price, block time
- [ ] probe part 2: `ReviveApi_runtime_pallets_address`, twin mapping both directions (`ReviveApi_account_id`, `ReviveApi_address`)
- [ ] probe part 3: Recovery metadata: call indices, arg names and types, block-number type, constants (`SecurityDeposit`, `MaxFriendsPerConfig`), consideration costs
- [ ] probe part 4: EOA Ethereum tx to pallets address with `system.remark_with_event` lands; record hash and resolved Substrate events
- [ ] probe part 5: `set_friend_groups` from MetaMask-style EOA (ramon) succeeds; `FriendGroupsChanged` event
- [ ] probe part 6: full mini rescue with delay 10 blocks: initiate (lorna), approve (ben), finish, `control_inherited_account(balances.transfer_keep_alive)`; read `RecoveredAccountControlled.call_result`
- [ ] probe part 7 (**headline mechanism**): `control_inherited_account(revive.call(vault.withdrawAllTo))` makes `msg.sender` the lost H160 (deploy a throwaway 1-function probe contract first if the vault is not deployed)
- [ ] probe part 8: Solidity contract calling the pallets address runs nothing (backs the contract-inheritor refusal)
- [ ] probe part 9: Ethereum tx hash to Substrate extrinsic matching rule confirmed
- [ ] Pre-register FINDINGS questions with a commit hash before probes 6 to 8 (Section 10)
- [ ] `PLATFORM_PROBE.md` and `DISCOVERY.md` (delete test: "remove Recovery and step 5 fails")
- [ ] **GATE 3b:** report Plan A / A-minus / B decision per Section 13; wait for Kinnoski's go

## Phase 4. G4 (thesis, risk)
- [ ] `THESIS.md` from Section 6 (five lines, hook, X without Y, primary guarantee, crew)
- [ ] `RISK.md`: deposits held vs lost, maximum loss per role, house drill keys, phrase is advisory, stranded friend-group deposit (measured)
- [ ] Name collision check for "Kedge" (npm, GitHub, web, crypto projects); backups "Kedging", "Salvor"; record result

## Phase 5. Contracts
- [ ] Foundry project; `AllotmentVault.sol` (Section 8.9); tests incl. fuzz and refusals; `forge test` green
- [ ] Probe contract `Caller.sol` for probe part 8 (if not done)
- [ ] `scripts/deploy.mjs`: estimate, print tPOT cost; **ask Kinnoski**; deploy; verify runtime bytecode equals artifact; write `deployments/testnet.json`
- [ ] Ramon saves pUSD into the vault through the ERC-20 precompile (approve + save) from his EOA; record txs
- [ ] (Stretch, only if budget allows and Kinnoski approves) tiny ink! vault; deploy; record

## Phase 6. Core library (the action path)
- [ ] `constants.ts`, `twin.ts` with tests against probe outputs
- [ ] `purser.ts`: all Recovery calls, `bringHome` with `force_batch`; metadata-driven arg shapes
- [ ] `watch/scale.mjs` dependency-free encoder; byte-for-byte test vs polkadot.js on live metadata
- [ ] `helm.ts`: send via EIP-1193 to pallets address, persist hash first, poll up to 600 s, resolve extrinsic, decode events incl. module error names
- [ ] `lookout.ts`: friend groups, attempts, inheritor, delay clock from `provided_block_number`
- [ ] `survey.ts`: inventory + `ReviveApi_call` dry runs + Will move / Will not move
- [ ] `mate.ts`: all pre-flight refusals incl. contract inheritor
- [ ] `phrase.ts` + curated `words-maritime.json` (2048 words) + tests (determinism, mismatch on any input change)
- [ ] Unit test suite green; commit

## Phase 7. Proof and break campaign (live testnet)
- [ ] `scripts/campaign.mjs` runs H1, H2, A1 to A12, C1, C2 (Section 9); refusals sent on chain
- [ ] `evidence/campaign/<id>.json` for each; failed extrinsics have decoded error names
- [ ] Fault switch `KEDGE_SABOTAGE` (9.2) with documented commands and results
- [ ] `scripts/facts.mjs` writes `docs/FACTS.json`; CI fails if README/UI numbers drift
- [ ] `PROOF.md`, `EVIDENCE.md`, `FINDINGS.md` (positive and negative results)
- [ ] `npm run verify`: keyless, re-reads every recorded tx from the public node and checks FACTS
- [ ] **GATE 7:** report results incl. misses and wrongly blocked count

## Phase 8. Watchkeeper (autonomous background loop)
- [ ] `watch/` job: cursor in Upstash, Recovery event scan, Telegram alert, one message per event
- [ ] `/api/watch`: EIP-191 signed subscription; refuse unsigned
- [ ] GitHub Actions schedule with loop chaining; test proving no key material in job or workflow
- [ ] Record one unattended run (attempt started while nobody watched, alert delivered); evidence saved

## Phase 9. Design system (before screens)
- [ ] `DESIGN.md` from Section 11 (mark, wordmark, tokens, fonts, motion, ornaments)
- [ ] Fonts via `next/font`: Bricolage Grotesque, Instrument Serif, Hanken Grotesk, JetBrains Mono
- [ ] Tokens in Tailwind v4 theme; paper background + grain + chart contours
- [ ] SVG set (Section 11.10) in `components/art/`; each checked at 24, 48, 96 px
- [ ] Hero image received from Kinnoski (11.8 prompt) and placed with mask; mobile crop
- [ ] `GlowCard`, square capsule nav, buttons, status ring, timeline, flag bitfield, receipt row components

## Phase 10. Screens (person first)
- [ ] Landing (9 sections, Section 11.6) with FACTS-driven stats
- [ ] Harbour (owner setup, groups, Lifeboat Card PDF, watch toggle, cost panel)
- [ ] Lifeboat Card PDF: wallet size, QR of lifeboat key encrypted with a passphrase the owner chooses, plain instructions; print test
- [ ] Crew door (phone first, phrase boxes, approve gated, refusal states)
- [ ] Rescue (timeline, countdown, survey, bring it home, honest receipt incl. ItemFailed state)
- [ ] Proof (in-browser decoding, before/after balances)
- [ ] Drill (SSE streamed steps, public lock, caps, kill switch, labelled house crew)
- [ ] Judge page (60 s / 3 min / 10 min walk)
- [ ] `/api/status` measured probes with timestamps; `/api/facts`; `/api/trace`
- [ ] Guided tour with 7 steps, render mode `?tour=1&render=1`

## Phase 11. Quality
- [ ] Playwright: all 7 viewports, overlap test, no horizontal scroll, h1, focus ring, zero console errors
- [ ] axe-core AA on every page; Lighthouse mobile >= 95 on all four categories
- [ ] Real wallet test: MetaMask desktop + MetaMask mobile in-app browser + SubWallet guardian
- [ ] Deploy to Vercel; reachability script curls every public path after deploy
- [ ] Real-people drill (9.1) with 2 to 3 consenting guardians; record times and confusion points honestly

## Phase 12. Red team (G9)
- [ ] Five judge-agent roles on the deployed URL (V5 Appendix B); `REDTEAM_LOG.md`
- [ ] Fix, redeploy, repeat until a clean round

## Phase 13. Story and submission
- [ ] README in Section 12 order; 2x2 screenshots from Playwright; landing banner; house-style test passes
- [ ] `SDK_SURFACE.md` with file:line; `JUDGE.md`; `PROGRESS.md` self-scores; `MILESTONES.md`
- [ ] Demo video (max 3 min) from tour render + live wallet clips: hook, flow, failure, explorer proof, receipt; timestamps in submission
- [ ] Pitch deck PDF (problem, why Portaldot is essential, proof, reasons for continued support)
- [ ] `SUBMISSION_DORAHACKS.md` mirroring the live form; Kinnoski reviews; **Kinnoski submits**
- [ ] Tag the submitted commit `v1.0-submitted`; freeze the deployment
- [ ] `PITCH.md` for Demo Day (Nov 8 to 9): 20 s hook, 60 s live drill, 30 s proof, fallback recording
- [ ] Community Choice: short X thread and Discord post with the drill link (Kinnoski publishes)
