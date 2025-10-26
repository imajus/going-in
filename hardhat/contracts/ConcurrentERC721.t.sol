// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../contracts/ConcurrentERC721.sol";

/**
 * @title ConcurrentERC721Test
 * @notice Basic test suite for ConcurrentERC721 - non-Arcology-specific tests only
 * @dev Tests that don't require reading U256Cumulative or U256Map values
 * Arcology-specific concurrent tests (minting, transfers, burns) are in ConcurrentERC721.test.js
 *
 * IMPORTANT: Cannot test minting, transfers, or burns in Solidity tests because:
 * - U256Map.get() and U256Cumulative.get() are not view functions
 * - These operations require actual Arcology DevNet to handle concurrent structures
 * - Solidity tests run in simulated EVM without Arcology's parallel execution support
 */
contract ConcurrentERC721Test {
    ConcurrentERC721 public nft;

    address public minter = address(this);
    address public alice = address(0x1);
    address public bob = address(0x2);

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function setUp() public {
        // Deploy NFT collection (this contract becomes the minter)
        nft = new ConcurrentERC721("Test NFT", "TNFT");
    }

    // ============ Basic Metadata Tests ============

    function test_Metadata() public view {
        assert(keccak256(bytes(nft.name())) == keccak256(bytes("Test NFT")));
        assert(keccak256(bytes(nft.symbol())) == keccak256(bytes("TNFT")));
        assert(nft.minter() == address(this));
    }

    // ============ Access Control Tests ============

    function test_MinterIsDeployer() public view {
        assert(nft.minter() == address(this));
    }

    function test_MintByNonMinter() public {
        // Create a helper contract to try minting
        NonMinterHelper helper = new NonMinterHelper(nft);

        // Attempt to mint from non-minter should revert
        try helper.tryMint(alice) {
            assert(false); // Should not reach here
        } catch {
            assert(true); // Expected revert
        }
    }

    // ============ Approval Tests (uses regular mapping, not U256Cumulative) ============

    function test_ApprovalForAll() public {
        nft.setApprovalForAll(alice, true);
        assert(nft.isApprovedForAll(address(this), alice) == true);

        // Revoke approval
        nft.setApprovalForAll(alice, false);
        assert(nft.isApprovedForAll(address(this), alice) == false);
    }

    // ============ ERC165 Interface Support Tests ============

    function test_SupportsInterface() public view {
        // ERC721 interface ID: 0x80ac58cd
        assert(nft.supportsInterface(0x80ac58cd) == true);

        // ERC721Metadata interface ID: 0x5b5e139f
        assert(nft.supportsInterface(0x5b5e139f) == true);

        // ERC165 interface ID: 0x01ffc9a7
        assert(nft.supportsInterface(0x01ffc9a7) == true);

        // Random unsupported interface
        assert(nft.supportsInterface(0xffffffff) == false);
    }
}

/**
 * @notice Helper contract to test minting from non-minter address
 */
contract NonMinterHelper {
    ConcurrentERC721 public nft;

    constructor(ConcurrentERC721 _nft) {
        nft = _nft;
    }

    function tryMint(address to) public returns (uint256) {
        return nft.mint(to);
    }
}
