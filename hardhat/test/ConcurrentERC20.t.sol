// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../contracts/ConcurrentERC20.sol";

/**
 * @title ConcurrentERC20Test
 * @notice Basic test suite for ConcurrentERC20 token - non-Arcology-specific tests only
 * @dev Tests that don't require reading U256Cumulative values (no balanceOf, totalSupply calls)
 * Arcology-specific concurrent tests are in ConcurrentERC20.test.js
 */
contract ConcurrentERC20Test {
    ConcurrentERC20 public token;

    address public alice = address(0x1);
    address public bob = address(0x2);

    uint256 constant INITIAL_SUPPLY = 1_000_000 * 10**18; // 1 million tokens

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function setUp() public {
        // Deploy token with initial supply
        token = new ConcurrentERC20("Test Token", "TEST", INITIAL_SUPPLY);
    }

    // ============ Basic Metadata Tests (no U256Cumulative reads) ============

    function test_Metadata() public view {
        assert(keccak256(bytes(token.name())) == keccak256(bytes("Test Token")));
        assert(keccak256(bytes(token.symbol())) == keccak256(bytes("TEST")));
        assert(token.decimals() == 18);
    }

    // ============ Approval Tests (uses regular uint256 mapping, not U256Cumulative) ============

    function test_Approval() public {
        uint256 approvalAmount = 5000 * 10**18;

        bool success = token.approve(alice, approvalAmount);

        assert(success);
        assert(token.allowance(address(this), alice) == approvalAmount);
    }

    function test_MultipleApprovals() public {
        token.approve(alice, 1000 * 10**18);
        assert(token.allowance(address(this), alice) == 1000 * 10**18);

        // Change approval
        token.approve(alice, 2000 * 10**18);
        assert(token.allowance(address(this), alice) == 2000 * 10**18);

        // Revoke approval
        token.approve(alice, 0);
        assert(token.allowance(address(this), alice) == 0);
    }

    function test_ApproveZeroAddress() public {
        // This should revert with "ERC20: approve to zero address"
        // Note: We can't test the revert message in Hardhat Solidity tests easily
        // This test will fail if approve doesn't revert as expected
        try token.approve(address(0), 1000) {
            assert(false); // Should not reach here
        } catch {
            assert(true); // Expected revert
        }
    }
}
