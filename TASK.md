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
- [x] Founder-stake line approved by Kinnoski (confirmed in chat 2026-11-04: accurate, happy to publish)

## Phase 3. G3 and G5 (discovery probes on the live chain)  <- the build lives or dies here
- [x] `scripts/keygen.mjs`: testnet keys for ramon, lorna, ben, ana, lifeboat, stranger, drill crew; addresses printed only (12 keys written to keys/ mode 600, addresses printed only, plus sr25519 guardian)
- [x] **GATE 3a:** give Kinnoski the funding list (addresses, amounts from live estimates); wait for funds (funding arrived before the ask was needed: deployer holds 500 tPOT. pUSD still needed, see report)
- [x] `scripts/probe.mjs` part 1: spec name/version, genesis, decimals, ED, NativeToEthRatio, gas price, block time (evidence/probe/part1.json)
- [x] probe part 2: `ReviveApi_runtime_pallets_address`, twin mapping both directions (`ReviveApi_account_id`, `ReviveApi_address`) (both directions match, sr25519 follows the keccak rule)
- [x] probe part 3: Recovery metadata: call indices, arg names and types, block-number type, constants (`SecurityDeposit`, `MaxFriendsPerConfig`), consideration costs (SecurityDeposit 0, MaxFriendsPerConfig 100, u32 block numbers)
- [x] probe part 4: EOA Ethereum tx to pallets address with `system.remark_with_event` lands; record hash and resolved Substrate events (tx 0xe2fdda58..., System.Remarked seen, gasUsed 0)
- [x] probe part 5: `set_friend_groups` from MetaMask-style EOA (ramon) succeeds; `FriendGroupsChanged` event (FriendGroupsChanged, no deposit taken)
- [x] probe part 6: full mini rescue with delay 10 blocks: initiate (lorna), approve (ben), finish, `control_inherited_account(balances.transfer_keep_alive)`; read `RecoveredAccountControlled.call_result` (full lifecycle from EOAs, call_result Ok)
- [x] probe part 7 (**headline mechanism**): `control_inherited_account(revive.call(vault.withdrawAllTo))` makes `msg.sender` the lost H160 (deploy a throwaway 1-function probe contract first if the vault is not deployed) (msg.sender equals the lost H160)
- [x] probe part 8: Solidity contract calling the pallets address runs nothing (backs the contract-inheritor refusal) (contract call is a silent no-op)
- [x] probe part 9: Ethereum tx hash to Substrate extrinsic matching rule confirmed (keccak256(payload) rule, 9 of 9)
- [x] Pre-register FINDINGS questions with a commit hash before probes 6 to 8 (Section 10) (commit 059260908a6ba139a07c26b2cc1c803dd95ab528)
- [x] `PLATFORM_PROBE.md` and `DISCOVERY.md` (delete test: "remove Recovery and step 5 fails") (delete test written)
- [ ] **GATE 3b:** report Plan A / A-minus / B decision per Section 13; wait for Kinnoski's go

## Phase 4. G4 (thesis, risk)
- [x] `THESIS.md` from Section 6 (five lines, hook, X without Y, primary guarantee, crew) (five lines, hook, X without Y, guarantee with honest limit, crew)
- [x] `RISK.md`: deposits held vs lost, maximum loss per role, house drill keys, phrase is advisory, stranded friend-group deposit (measured) (deposits measured: all zero except the contract storage deposit)
- [x] Name collision check for "Kedge" (npm, GitHub, web, crypto projects); backups "Kedging", "Salvor"; record result (no crypto project named Kedge; recorded in RISK.md)

## Phase 5. Contracts
- [x] Foundry project; `AllotmentVault.sol` (Section 8.9); tests incl. fuzz and refusals; `forge test` green (forge 1.5.1 from the official release tarball; 10 tests pass incl. 2 fuzz)
- [x] Probe contract `Caller.sol` for probe part 8 (if not done) (deployed in Phase 3)
- [x] `scripts/deploy.mjs`: estimate, print tPOT cost; **ask Kinnoski**; deploy; verify runtime bytecode equals artifact; write `deployments/testnet.json` (approved by Kinnoski; vault 0x92cD058C... cost 91.0 tPOT; bytecode matches)
- [x] Ramon saves pUSD into the vault through the ERC-20 precompile (approve + save) from his EOA; record txs (used the kUSD test asset 20261104 because the pUSD pool is too thin; approve block 317288, save block 317289)
- [ ] (Stretch, only if budget allows and Kinnoski approves) tiny ink! vault; deploy; record

## Phase 6. Core library (the action path)
- [x] `constants.ts`, `twin.ts` with tests against probe outputs (twin tests use recorded probe outputs)
- [x] `purser.ts`: all Recovery calls, `bringHome` with `force_batch`; metadata-driven arg shapes (metadata-driven, force_batch, sweep order tested live)
- [x] `watch/scale.mjs` dependency-free encoder; byte-for-byte test vs polkadot.js on live metadata (byte-for-byte equal to polkadot.js on live metadata, 14 call shapes plus compact edge cases)
- [x] `helm.ts`: send via EIP-1193 to pallets address, persist hash first, poll up to 600 s, resolve extrinsic, decode events incl. module error names (hash persisted first, 600 s poll, keccak rule, decodes ExtrinsicFailed, EthExtrinsicRevert and ItemFailed)
- [x] `lookout.ts`: friend groups, attempts, inheritor, delay clock from `provided_block_number` (bitfield decode verified against recorded probe data)
- [x] `survey.ts`: inventory + `ReviveApi_call` dry runs + Will move / Will not move (inventory, ReviveApi_call dry run, Will move / Will not move)
- [x] `mate.ts`: all pre-flight refusals incl. contract inheritor (all refusals incl. contract inheritor; fault switch)
- [x] `phrase.ts` + curated `words-maritime.json` (2048 words) + tests (determinism, mismatch on any input change) (BIP39 English list used instead of a hand-curated maritime list; deviation disclosed in the code and README)
- [x] Unit test suite green; commit (21 tests, node --test with tsx)

## Phase 7. Proof and break campaign (live testnet)
- [x] `scripts/campaign.mjs` runs H1, H2, A1 to A12, C1, C2 (Section 9); refusals sent on chain (scripts/campaign.mts; H1, H2, A1 to A12, C1, C2 all pass)
- [x] `evidence/campaign/<id>.json` for each; failed extrinsics have decoded error names (16 scenario files plus run logs)
- [x] Fault switch `KEDGE_SABOTAGE` (9.2) with documented commands and results (evidence/campaign/SABOTAGE_sort.json, block 317530)
- [x] `scripts/facts.mjs` writes `docs/FACTS.json`; CI fails if README/UI numbers drift (FACTS drift test in the suite)
- [x] `PROOF.md`, `EVIDENCE.md`, `FINDINGS.md` (positive and negative results) (generated and written)
- [x] `npm run verify`: keyless, re-reads every recorded tx from the public node and checks FACTS (31 of 31 transactions re-read, ALL CHECKS PASSED)
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
