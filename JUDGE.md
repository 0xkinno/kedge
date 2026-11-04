# JUDGE

## 60 seconds
1. Open `/drill`, press Start. A full rescue runs on the Portaldot V3 testnet with live block countdown.
2. Open `/proof`, filter to A3, press Check: `recovery.NotYetInheritable`, decoded in your browser from the public node.

## 3 minutes
1. The four numbers on the home page come from `docs/FACTS.json`.
2. Open the vault deploy block from README "Testnet deployment".
3. Open `/proof` scenario C1: an account with no crew; nothing can move it.

## 10 minutes
1. `npm ci && npm run verify`: re-reads every recorded transaction from the public node, no key.
2. `docs/FINDINGS.md`: what V3 actually does, including where we were wrong (an error name, the zero deposit, the refused-call shape).
3. `/harbour` with your own funded wallet for the real path. Your wallet signs.
4. `SDK_SURFACE.md` for the Portaldot parts used with file and line, and what is **not** used.

## Please check us on
Both directions of the safety claim: attacks stopped, and legitimate rescues blocked (measured 0). And the honest limits: no ink! contract, a zero security deposit on this testnet, no real-people drill yet, no public deployment yet.
