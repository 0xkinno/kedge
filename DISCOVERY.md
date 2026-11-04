# DISCOVERY

## What everyone assumes

An EVM wallet whose seed is gone is gone. Either you accept that, or you move to a smart-contract wallet before
the loss, or you hand your seed to a company.

## What is true on Portaldot V3 (measured, not claimed)

A plain MetaMask address has a native twin account. An Ethereum transaction sent to the runtime pallets address
is dispatched as a native call signed by that twin. That includes the Recovery pallet. Five people (owner,
two guardians, an inheritor) completed a full recovery lifecycle using only Ethereum transactions
(`PLATFORM_PROBE.md`, parts 4 to 6). The inheritor then ran a Solidity contract call as the lost account,
and the contract saw the lost address as `msg.sender` (part 7). So contract positions that only the old
address could withdraw are reachable by the rescuer.

## The delete test

> Remove Recovery and step 5 fails.

Step 5 of the rescue is `recovery.control_inherited_account`. Without the Recovery pallet there is no inheritor
and no way to dispatch a call as the lost account, so the vault withdraw cannot run with the lost address as
`msg.sender`. Neither the pallets address alone (it only signs as the sender's own twin) nor the contract
alone (part 8: a contract calling the pallets address runs nothing) can do it. Both Portaldot parts are
required.

## Limits stated now

- A contract cannot be the inheritor: a contract calling the pallets address does nothing (part 8).
- The security deposit is zero on V3, so slashing carries no financial penalty (`FINDINGS.md`).
- The lost account must hold tPOT to pay contract storage deposits during the sweep (`FINDINGS.md`).
