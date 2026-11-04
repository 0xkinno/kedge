// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IERC20 {
  function transferFrom(address f, address t, uint256 v) external returns (bool);
  function transfer(address t, uint256 v) external returns (bool);
}

/// @notice A seafarer's savings in a native Portaldot asset (pUSD via the ERC-20 precompile).
/// Only the saver can withdraw. That is the point: Kedge proves a rescued account can still withdraw.
contract AllotmentVault {
  IERC20 public immutable token;
  mapping(address => uint256) public savingsOf;
  event Saved(address indexed saver, uint256 amount);
  event Withdrawn(address indexed saver, address indexed to, uint256 amount);
  error Nothing();
  error TransferFailed();

  constructor(IERC20 t) { token = t; }

  function save(uint256 amount) external {
    if (amount == 0) revert Nothing();
    if (!token.transferFrom(msg.sender, address(this), amount)) revert TransferFailed();
    savingsOf[msg.sender] += amount;
    emit Saved(msg.sender, amount);
  }

  /// Called by the rescue as the lost account: msg.sender is the lost address.
  function withdrawAllTo(address to) external {
    uint256 a = savingsOf[msg.sender];
    if (a == 0) revert Nothing();
    savingsOf[msg.sender] = 0; // frees the slot, returns its deposit
    if (!token.transfer(to, a)) revert TransferFailed();
    emit Withdrawn(msg.sender, to, a);
  }
}
