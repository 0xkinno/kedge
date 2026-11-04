# PROGRESS

Self-scores (1 to 5) against the four criteria. Rivals A, B, C are the three strongest samples studied (names are kept out of the repository). These are the author's own scores with the evidence behind each, not a prediction. Any "no" below stops polishing until fixed or disclosed.

| Criterion | Kedge | Rival A (price oracle) | Rival B (prize-bond pool) | Rival C (cross-VM API meter) | Evidence for Kedge |
|---|---|---|---|---|---|
| Technical Feasibility (30%) | 4 | 5 | 3 | 4 | 31 recorded transactions re-verified by `npm run verify`, 23 tests, CI, refusals on chain. Lower than 5 because: no public deployment, no real-wallet test, short history (2 days) |
| Innovation (30%) | 4 | 3 | 3 | 3 | first use of Recovery on V3 in any sample, `msg.sender` as the lost address proven. Lower than 5 because there is no ink! contract, so "WASM/EVM" is half shown |
| Ecosystem Contribution (20%) | 3 | 4 | 2 | 3 | first public Recovery measurements, open encoder. No integration kit published yet |
| Business Potential (20%) | 3 | 3 | 3 | 3 | named market, sourced numbers. No user conversations recorded |

## Done
Phases 0 to 8 (repo, intel, moment, probes, thesis, contracts, library, campaign, watchkeeper), the web app, the quality gates, the docs set.

## Not done, and why
- **Public deployment (Vercel):** `scripts/deploy_vercel.sh` does the whole deploy and tests the live link, but it needs a Vercel API token. The Vercel login on the owner's machine does not exist in this cloud container.
- **Real wallet extensions** (Rabby, SubWallet, MetaMask mobile): not run. The wallet journey is proven with an injected EIP-1193 test wallet backed by real signing keys (`e2e/wallet.mjs`, videos in `docs/demo/test-run/`). Installing and onboarding extensions in headless Chromium was not attempted.
- **Real-people drill:** needs 2 to 3 consenting guardians. Not invented.
- **Unattended Watchkeeper run:** needs a Telegram bot token and Upstash. A file-sink run on chain is recorded in `evidence/watch/demo-run.json`.
- **Final demo video:** the test-run recordings and a silent tour recording exist as raw scenes; the edited film is the next step.
- **ink! contract:** not built, so the WASM half of WASM/EVM is not demonstrated.
- **Independent red team:** a single-model self red team was run, see REDTEAM_LOG.md.
