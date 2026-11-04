// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import {AllotmentVault, IERC20} from "../src/AllotmentVault.sol";

contract MockToken is IERC20 {
  mapping(address => uint256) public balanceOf;
  mapping(address => mapping(address => uint256)) public allowance;
  bool public failTransfers;
  function mint(address to, uint256 v) external { balanceOf[to] += v; }
  function approve(address s, uint256 v) external { allowance[msg.sender][s] = v; }
  function setFail(bool f) external { failTransfers = f; }
  function transferFrom(address f, address t, uint256 v) external returns (bool) {
    if (failTransfers) return false;
    require(allowance[f][msg.sender] >= v && balanceOf[f] >= v, "no");
    allowance[f][msg.sender] -= v; balanceOf[f] -= v; balanceOf[t] += v; return true;
  }
  function transfer(address t, uint256 v) external returns (bool) {
    if (failTransfers) return false;
    require(balanceOf[msg.sender] >= v, "no");
    balanceOf[msg.sender] -= v; balanceOf[t] += v; return true;
  }
}

contract AllotmentVaultTest is Test {
  AllotmentVault vault; MockToken tok;
  address ramon = address(0xA11CE); address newPhone = address(0xB0B); address stranger = address(0xBAD);
  event Saved(address indexed saver, uint256 amount);
  event Withdrawn(address indexed saver, address indexed to, uint256 amount);

  function setUp() public {
    tok = new MockToken(); vault = new AllotmentVault(IERC20(address(tok)));
    tok.mint(ramon, 1_000e6);
    vm.prank(ramon); tok.approve(address(vault), type(uint256).max);
  }

  function test_save_records_and_moves_tokens() public {
    vm.expectEmit(true, false, false, true); emit Saved(ramon, 150e6);
    vm.prank(ramon); vault.save(150e6);
    assertEq(vault.savingsOf(ramon), 150e6);
    assertEq(tok.balanceOf(address(vault)), 150e6);
  }

  function test_withdraw_runs_as_saver_and_pays_destination() public {
    vm.prank(ramon); vault.save(150e6);
    vm.expectEmit(true, true, false, true); emit Withdrawn(ramon, newPhone, 150e6);
    vm.prank(ramon); vault.withdrawAllTo(newPhone); // msg.sender is the lost address
    assertEq(vault.savingsOf(ramon), 0);
    assertEq(tok.balanceOf(newPhone), 150e6);
  }

  function test_zero_save_refused() public {
    vm.prank(ramon); vm.expectRevert(AllotmentVault.Nothing.selector); vault.save(0);
  }

  function test_zero_withdraw_refused() public {
    vm.prank(ramon); vm.expectRevert(AllotmentVault.Nothing.selector); vault.withdrawAllTo(newPhone);
  }

  function test_non_saver_gets_nothing() public {
    vm.prank(ramon); vault.save(150e6);
    vm.prank(stranger); vm.expectRevert(AllotmentVault.Nothing.selector); vault.withdrawAllTo(stranger);
    assertEq(vault.savingsOf(ramon), 150e6);
  }

  function test_failed_token_transfer_reverts_whole_save() public {
    tok.setFail(true);
    vm.prank(ramon); vm.expectRevert(AllotmentVault.TransferFailed.selector); vault.save(1e6);
    assertEq(vault.savingsOf(ramon), 0);
  }

  function test_failed_token_transfer_keeps_savings_on_withdraw() public {
    vm.prank(ramon); vault.save(10e6);
    tok.setFail(true);
    vm.prank(ramon); vm.expectRevert(AllotmentVault.TransferFailed.selector); vault.withdrawAllTo(newPhone);
    assertEq(vault.savingsOf(ramon), 10e6); // revert restores the slot
  }

  function test_withdraw_twice_second_refused() public {
    vm.prank(ramon); vault.save(5e6);
    vm.prank(ramon); vault.withdrawAllTo(newPhone);
    vm.prank(ramon); vm.expectRevert(AllotmentVault.Nothing.selector); vault.withdrawAllTo(newPhone);
  }

  function testFuzz_save_then_withdraw_conserves(uint96 a, uint96 b) public {
    a = uint96(bound(a, 1, 500e6)); b = uint96(bound(b, 1, 500e6));
    vm.startPrank(ramon); vault.save(a); vault.save(b); vm.stopPrank();
    assertEq(vault.savingsOf(ramon), uint256(a) + b);
    vm.prank(ramon); vault.withdrawAllTo(newPhone);
    assertEq(tok.balanceOf(newPhone), uint256(a) + b);
    assertEq(tok.balanceOf(address(vault)), 0);
  }

  function testFuzz_savers_are_independent(address other, uint96 a) public {
    vm.assume(other != ramon && other != address(0) && other != address(vault));
    a = uint96(bound(a, 1, 500e6));
    vm.prank(ramon); vault.save(a);
    vm.prank(other); vm.expectRevert(AllotmentVault.Nothing.selector); vault.withdrawAllTo(other);
  }
}
