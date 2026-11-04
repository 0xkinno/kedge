// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @notice Probe 8: a contract calls the Portaldot pallets address with a SCALE-encoded runtime call.
/// The outer call succeeds; the probe checks that no native event fires.
contract Caller {
  address constant PALLETS = 0x6D6f646c70792F70616464720000000000000000;
  event Called(bool ok, uint256 returnSize);
  function poke(bytes calldata runtimeCall) external {
    (bool ok, bytes memory r) = PALLETS.call(runtimeCall);
    emit Called(ok, r.length);
  }
}
