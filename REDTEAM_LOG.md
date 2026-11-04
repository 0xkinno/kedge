# REDTEAM_LOG

**What this is, honestly.** A self red team by the same model that built the product, run against the local production build on 2026-11-04. It is not five independent judge agents on a deployed URL (the spec's V5 Appendix B was not available and there is no deployment yet). Treat it as a first pass, not as external review.

Five lenses, each with real probes (commands and tools, not opinions).

## Round 1

| Lens | Probe | Finding | Fix |
|---|---|---|---|
| Skeptical technical judge | read the first campaign run | the Helmsman reported refused calls as successes: a failed call is `ExtrinsicSuccess` plus `revive.EthExtrinsicRevert`, receipt status 0 | decode `EthExtrinsicRevert`, record in FINDINGS item 7, rerun the campaign |
| Skeptical technical judge | compare predictions with results | A4 returned `AlreadyApproved`, not the predicted `AlreadyVoted` | published as a miss, criterion amended openly (`scripts/amend_a4.mjs`) |
| Skeptical technical judge | "wrongly blocked" count | the first count was 1 because a label regex matched an attack | fixed in `scripts/facts.mjs`; the count is now 0 and a test guards counts |
| Business judge | read the first screen for hype and jargon | none found by the house-style check; the first screen avoids the banned words | none |
| Accessibility reviewer | axe-core AA at 7 viewports | white text on the orange accent measured 3.1:1; brass labels too faint; the sr-only span widened the page on phones; the logo tap target was small | ink text on orange, darker text tokens, `relative` scroll container, 44 px logo target. 63 of 63 checks pass |
| Performance reviewer | Lighthouse mobile | home scored 88 (blocking time 460 ms from the animation library) | replaced with CSS motion. 99 on home, all pages 95 or more in all four categories |
| Security reviewer | malformed addresses, bad hashes, bad JSON, wrong signer, script tag in a route | all refused with clear 400 or 401 errors; no injection | none needed |
| Security reviewer | response headers | `X-Powered-By` leaked the framework | `poweredByHeader: false` |
| Security reviewer | kill switch and missing keys | `DRILL_KILL=1` returns 503 with a clear message; a deployment without keys returns 503 and says drill is unavailable, not simulated | none needed |
| Security reviewer | public lock | a second drill during a run is refused with 409 | none needed |
| First-time user | screenshot review | the Rescue timeline showed "Attempt started" as not done after a finished recovery (the attempt record is consumed); the drill receipt reported the shared pool balance as "moved"; the status ring said "Checking" with no wallet | fixed all three |

## Round 2 (after the fixes)
Gates rerun on the rebuilt app (2026-11-04): 63 of 63 page-viewport checks pass with zero failures (`e2e/quality-report.json`); Lighthouse mobile is 95 or more in all four categories on the five pages tested (`e2e/lighthouse/`). A clean round on these probes. It is still a self review.

## Not covered
No external testers, no real MetaMask or SubWallet session, no load test, no review of the Solidity by a second person, no formal audit.
