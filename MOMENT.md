# MOMENT

One person, one action, one primitive, one sentence.

> When a seafarer's phone goes overboard, Kedge lets his crew and family bring his wallet back, using
> Portaldot's built-in Recovery pallet, signed from the MetaMask he already has.

## The person (fictional, labelled on every surface)

Ramon Dizon, 34, able seaman from Iloilo, Philippines. Seven months into a nine-month contract on a bulk
carrier. His wages and savings sit in a wallet on his phone.

- **Lorna**, his wife, runs the house in Iloilo.
- **Ana**, his sister, is a nurse in Dubai.
- **Ben** is the bosun on his ship.

Ramon is invented. The mechanism is real and runs on testnet. Every screen says so.

## The moment, with a clock

03:40 ship's time, anchorage off Singapore. During a mooring operation his phone slips out of his coverall
pocket and goes over the side. His seed phrase is on a scrap of paper in a drawer in Iloilo, or nowhere.
Port wifi is 9 days away. The next allotment is due to Lorna in 12 days.

(Story details such as "9 days" and "12 days" belong to the fictional persona and are not claims about the world.)

## Today, without Kedge

He calls home on the ship's satellite line. Nobody can do anything. A seed-phrase wallet has no "forgot
password". Custodial apps want identity checks from a ship with no signal. A company-run seed backup means
handing his keys to a company.

## The action Kedge completes

Before the voyage Ramon names his crew in Kedge, from MetaMask. After the loss, Lorna and Ben confirm on a
call that it is really him, approve on their phones, and after the safety delay his new phone receives
everything: tPOT, pUSD, and the savings his allotment contract holds for him. One MetaMask signature does the
sweep.

## The artifact he already uses

A printed **Lifeboat Card** (PDF, wallet size) kept in the document folder with his passport and Seaman's
Book. Seafarers carry that folder everywhere. The card alone cannot move a cent.

## The human's physical role

Guardians are the eyes and judgment. They hear Ramon read a four-word **call phrase** on a voice or video call
and type it before the approve button unlocks. Software cannot tell Ramon from a scammer holding his
messaging account. A person can. The phrase check is advisory UI. The chain enforces threshold and delay.

## What everyone assumes, and what is true

Everyone assumes an EVM wallet without its seed is gone forever, or that it needs a smart-contract wallet.
On Portaldot V3 a plain MetaMask address can be brought back by people it trusts, because its native twin
account can use the chain's own Recovery pallet, and Solidity contracts can pay the rescued address back.

Status of that claim: the Recovery calls exist in live V3 metadata (verified 2026-11-04, see
SPONSOR_INTEL.md). Dispatch from MetaMask and the contract pay-back are the headline mechanism and are not yet
proven. They are tested in Phase 3. If a probe fails, this file changes.

## Second domain (one line in the README)

The same mechanism with a higher-priority Family group and a long delay is inheritance if Ramon never comes
home.

## Sourced pain table

Every row was opened on 2026-11-04 and its quote re-checked against the live page by
`scripts/verify_sources.mjs`. Full records, quotes and caveats are in `docs/sources.json`.

| What is true | Source | Caveat |
|---|---|---|
| About 1.89 million seafarers serve the world merchant fleet | [Marine Log on the BIMCO/ICS 2021 report](https://www.marinelog.com/news/world-shipping-faces-looming-officer-shortage/), 28 Jul 2021 | Press coverage of the 2021 report. BIMCO now lists a 2026 edition that could not be read here, so this is not the newest estimate |
| Sea-based Filipino workers sent home $7.139 billion in 2025 | [BusinessWorld, citing BSP data](https://bworldonline.com/top-stories/2026/02/17/730931/ofw-remittances-hit-record-35-6b/), 17 Feb 2026 | Secondary report of Bangko Sentral ng Pilipinas figures. This is the landing-page money figure, generated into `docs/landing_figures.json` |
| About 3.7 million bitcoin, around 20 percent of supply, had not moved for five years or more (June 2020) | [Decrypt on a Chainalysis report](https://decrypt.co/37171/lost-bitcoin-3-7-million-bitcoin-are-probably-gone-forever) | Dormancy is a proxy, not proof of lost keys. The Chainalysis post itself was not found. Worded as "dormant", never "lost keys" |
| A vendor's seed backup service split the phrase among three custodians and drew public backlash (2023) | [Decrypt, 19 May 2023](https://decrypt.co/140692/so-much-anger-so-much-hate-says-ledger-co-founder-amid-botched-recover-service-launch) | The vendor is named in the source. Kedge copy may say "a hardware-wallet vendor" |
| An exchange founder died and about $190 million CAD in customer crypto became inaccessible (2019) | [Vice, 4 Feb 2019](https://www.vice.com/en/article/customers-out-dollar190m-after-founder-dies-cryptocurrency-exchange-says/) | Later reporting alleged misappropriation. Cite as "reported at the time as inaccessible" |
| The Philippines ranks 9th and Nigeria 6th overall in the 2025 adoption index | [Chainalysis, 2 Sep 2025](https://www.chainalysis.com/blog/2025-global-crypto-adoption-index/) | Ranks come from the table, not the article prose |

Rows replaced or reworded against the instruction's draft: the lost-bitcoin row (dormancy, not lost keys), and
the Philippines row now cites a verified dollar figure for sea-based workers only.

## Founder stake (DRAFT, awaiting Kinnoski's approval; not to be published until approved)

> Kinnoski is training toward STCW maritime certification. Ramon's moment is his future working life.

Open question for Kinnoski: is that sentence accurate and are you happy to publish it as written?
