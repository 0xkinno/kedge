# AllotmentInk

The savings vault from `contracts/src/AllotmentVault.sol`, written in ink! and compiled to WASM for `pallet-contracts`. Only the saver can withdraw; a Kedge rescue runs `withdraw_all_to` as the lost account through `recovery.control_inherited_account`, so the savings come home with the rest of the sweep.

| | |
|---|---|
| Contract | `5HoLffhmPu5RnLxE6ZxiKQBJzcWNG6EwaVt9mQkSpULrKQBx` |
| Code hash | `0xc92e869205791f4c738f9349177a9f3d806f956a708b0e182f7f0290ff79d5be` |
| Deployed | block 337181, size 4,947 bytes of WASM |
| Messages | `save` (payable, `0xeccd14ba`), `savings_of` (`0x12c421cf`), `withdraw_all_to` (`0x78e4f3c2`) |

This chain charges 0.06 tPOT per byte of contract code, so the contract has no events and no error type; a refused call reverts.

```bash
cd ink/allotment_ink && cargo contract build --release     # toolchain pinned in rust-toolchain.toml
node scripts/ink_deploy.mjs --dry                           # dry run, prints the storage deposit
npx tsx scripts/ink_rescue.mts                              # live rescue that sweeps savings held in this contract
npm run verify                                              # keyless re-read of the deployment and the rescue
```
