# RULES_EXTRACT

Event: **Portaldot Hacker House 2026**, run by the Portaldot Network Ecosystem Foundation.
Platform: DoraHacks (application, check-in, final submission). Live activity: Discord, https://discord.gg/portaldot.

**Source status.** Extracted on 2026-11-04 from the organiser's announcement as quoted in the build instruction
(Section 2). The DoraHacks event page could not be fetched from this environment (HTTP 405) and a web search
returned nothing for this event. Every row below is therefore "from the announcement, not yet checked against
the live DoraHacks page". Kinnoski to confirm the form fields on the live page before submission.

## Dates (WAT = UTC+1)

| Item | UTC | WAT |
|---|---|---|
| Code window opens | Oct 14 2026 | Oct 14 2026 |
| Final submission and code freeze | Nov 6 2026, 04:00 | **Nov 6 2026, 05:00** |
| Live Demo Day (Discord) | Nov 8 to 9 | Nov 8 to 9 |
| Community Choice voting | Nov 9 16:00 to Nov 10 16:00 | Nov 9 17:00 to Nov 10 17:00 |
| Winners | Nov 11 | Nov 11 |

Time left at extraction (2026-11-04 06:30 WAT): about 46 hours to the freeze.

## Tracks (verbatim)

1. Modular Cloud & Middleware: "Build decentralized middleware, storage/data components, and APIs based on Portaldot's modular architecture."
2. Multi-Chain & Cross-Chain Infra: "Leverage Portaldot's cross-chain capabilities to build asset/data bridges and liquidity engines."
3. Node Operations & Tooling: "Node monitoring, automated staking, node data visualization, and network security analysis tools."
4. **Ecosystem DApps: "Innovative DeFi, RWA tokenization, and consumer-facing applications."** Kedge enters here.

## Prizes

| Prize | USDT |
|---|---|
| Grand Prize (highest overall score) | 1,000 |
| Track first place (each track) | 800 |
| Ecosystem DApps second | 500 |
| Ecosystem DApps third | 300 |
| Community Choice (stackable) | 200 |

If the Grand Prize winner is in a track, that track award passes to the next project in the track.

## Evaluation (exact words and weights)

| Criterion | Weight | Words |
|---|---|---|
| Technical Feasibility | 30% | "technical approach, system architecture, code completeness, and actual delivery"; "whether GitHub shows genuine and sustained development activity"; "deployed on Portaldot testnet with verifiable on-chain interactions" |
| Innovation | 30% | "effective use of Portaldot V3 features such as WASM/EVM compatibility, modular architecture, and multi-chain capabilities"; "real value beyond existing solutions" |
| Ecosystem Contribution | 20% | "contribution to Portaldot infrastructure, developer tools, node ecosystem, application ecosystem, and user growth"; "potential for sustained building, open-source value" |
| Business Potential | 20% | "real market needs"; "target users and use cases are clear"; "business model and growth path are feasible" |

"Evaluation will be based on objective evidence including GitHub repositories, commit timelines, testnet
transaction records, contract addresses, transaction hashes, and live demo performance."

## DoraHacks final submission fields

Project name; team members; one-sentence overview; public GitHub repo; complete README; deployment
instructions; project documentation; reproducible runnable code; testnet deployment info; runnable demo (web
link or local instructions); demo video (max 3 minutes, real product, core functions, Portaldot integration
shown, public link); pitch deck (PDF or public link: problem, why Portaldot is essential, proof of
functionality, reasons for continued support); contract addresses and transaction hashes.

## Code compliance rules (event rule, not a timer)

- Repository is public.
- 3 or more valid commits inside the event window.
- Code is primarily produced inside the window (Oct 14 to Nov 6).
- Core modules must not land all at once in the last 24 hours before the deadline.

**Consequence for this build.** The repository starts on Nov 4, and the freeze is Nov 6 05:00 WAT. The 24-hour
rule means the final window starts Nov 5 05:00 WAT. Core modules (contracts, purser, helm, lookout, survey,
mate) must be committed as each one works, starting now, with real messages. No squash, no history rewrite.

## Network facts used by the build (live-verified 2026-11-04, see SPONSOR_INTEL.md)

| | |
|---|---|
| Substrate WS | wss://test-node-v3.portaldot.dev |
| EVM RPC | https://test-evm-rpc-v3.portaldot.dev (chain id 420420777, 0x190f1ca9, confirmed by `eth_chainId`) |
| Runtime | portaldot-v3, spec 3002, 69 pallets (confirmed by metadata) |
| Explorer | https://scanner-testnet-v3.portaldot.dev |
| Faucet | none public; tPOT goes to registered participants through a Discord ticket, native `5...` address |
