// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @notice Probe 7: records msg.sender so we can see whose address a rescue call runs as.
contract SenderProbe {
  address public last;
  event Seen(address who);
  function ping() external { last = msg.sender; emit Seen(msg.sender); }
}
