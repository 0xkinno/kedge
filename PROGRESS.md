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
- **Public deployment (Vercel):** needs the owner's Vercel account and env vars.
- **Real wallet tests** (MetaMask desktop, MetaMask mobile in-app browser, SubWallet): need physical wallets. The code path is the standard EIP-1193 `eth_sendTransaction`, tested only through ethers wallets.
- **Real-people drill:** needs 2 to 3 consenting guardians. Not invented.
- **Unattended Watchkeeper run:** needs a Telegram bot token and Upstash. A file-sink run on chain is recorded in `evidence/watch/demo-run.json`.
- **Hero photograph, demo video with live wallet clips, narrated tour:** need the owner's image and wallet; a silent tour recording is produced instead.
- **Lighthouse and axe:** run locally on the production build, not on a deployed URL.
- **Judge-agent red team:** a single-model self red team was run, see REDTEAM_LOG.md. V5 Appendix B was not available.
