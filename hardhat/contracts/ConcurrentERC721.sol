// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@arcologynetwork/concurrentlib/lib/runtime/Runtime.sol";
import "@arcologynetwork/concurrentlib/lib/map/U256.sol";
import "@arcologynetwork/concurrentlib/lib/commutative/U256Cum.sol";

/**
 * @title ConcurrentERC721
 * @notice Bare ERC-721 implementation using Arcology's concurrent structures for parallel-safe operations
 * @dev NO OpenZeppelin dependency to avoid read-after-write conflicts in parallel execution
 *
 * Key Features:
 * - Token IDs generated via Runtime.uuid() for guaranteed uniqueness in parallel mints
 * - U256Map for ownership tracking (tokenId → owner as uint160)
 * - mapping(address => U256Cumulative) for balance tracking (enables parallel balance updates)
 * - Standard mappings for approvals (single-tx operations, conflict-safe)
 * - Write-only mint operations (no reads after writes)
 * - Read-then-write pattern for transfers and burns
 *
 * ERC-721 Interface:
 * - balanceOf(address) → uint256
 * - ownerOf(uint256) → address
 * - transferFrom(address, address, uint256)
 * - safeTransferFrom(address, address, uint256)
 * - approve(address, uint256)
 * - setApprovalForAll(address, bool)
 * - getApproved(uint256) → address
 * - isApprovedForAll(address, address) → bool
 * - supportsInterface(bytes4) → bool (ERC-165)
 */
contract ConcurrentERC721 {
    // ============ State Variables ============

    // Metadata
    string public name;
    string public symbol;

    // Concurrent data structures
    U256Map private _owners;                         // tokenId → owner address (as uint160)
    mapping(address => U256Cumulative) private _balances;  // owner → balance counter (U256Cumulative)
    U256Cumulative private _totalSupply;             // Total number of tokens (minted - burned)

    // Standard mappings for approvals (conflict-safe for single-tx operations)
    mapping(uint256 => address) private _tokenApprovals;           // tokenId → approved address
    mapping(address => mapping(address => bool)) private _operatorApprovals; // owner → operator → approved

    // Access control
    address public immutable minter;

    // ============ Events ============

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    // ============ Constructor ============

    /**
     * @notice Initialize NFT collection with concurrent structures
     * @param name_ Token name (e.g., "VIP Ticket")
     * @param symbol_ Token symbol (e.g., "TICKET")
     */
    constructor(string memory name_, string memory symbol_) {
        name = name_;
        symbol = symbol_;

        // Initialize Arcology concurrent structures
        _owners = new U256Map();
        _totalSupply = new U256Cumulative(0, type(uint256).max);
        // Note: _balances mapping entries are initialized on-demand in mint()

        // Set minter to contract deployer (usually TicketingCore)
        minter = msg.sender;
    }

    // ============ ERC-165 Interface Support ============

    /**
     * @notice Check if contract supports a given interface
     * @param interfaceId Interface identifier
     * @return bool True if interface is supported
     */
    function supportsInterface(bytes4 interfaceId) public pure returns (bool) {
        return
            interfaceId == 0x01ffc9a7 || // ERC-165
            interfaceId == 0x80ac58cd || // ERC-721
            interfaceId == 0x5b5e139f;   // ERC-721 Metadata
    }

    // ============ View Functions ============

    /**
     * @notice Get total number of tokens currently existing (minted - burned)
     * @return Current total supply
     */
    function totalSupply() public view returns (uint256) {
        return _totalSupply.get();
    }

    /**
     * @notice Get number of tokens owned by address
     * @param owner Address to query
     * @return Number of tokens owned
     */
    function balanceOf(address owner) public view returns (uint256) {
        require(owner != address(0), "ConcurrentERC721: balance query for zero address");
        // Return 0 if balance cumulative not initialized yet
        if (address(_balances[owner]) == address(0)) {
            return 0;
        }
        return _balances[owner].get();
    }

    /**
     * @notice Get owner of a token
     * @param tokenId Token ID to query
     * @return Address of token owner
     */
    function ownerOf(uint256 tokenId) public returns (address) {
        address owner = address(uint160(_owners.get(tokenId)));
        require(owner != address(0), "ConcurrentERC721: owner query for nonexistent token");
        return owner;
    }

    /**
     * @notice Get approved address for a token
     * @param tokenId Token ID to query
     * @return Address approved to transfer this token
     */
    function getApproved(uint256 tokenId) public returns (address) {
        require(_exists(tokenId), "ConcurrentERC721: approved query for nonexistent token");
        return _tokenApprovals[tokenId];
    }

    /**
     * @notice Check if operator is approved for all tokens of owner
     * @param owner Token owner address
     * @param operator Operator address
     * @return bool True if operator is approved
     */
    function isApprovedForAll(address owner, address operator) public view returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    // ============ Minting (Write-Only Pattern) ============

    /**
     * @notice Mint a new NFT with conflict-free UUID generation
     * @dev Only callable by minter (TicketingCore contract)
     * @dev Uses Runtime.uuid() for guaranteed unique token IDs in parallel execution
     * @dev CRITICAL: Write-only operations - no reads after writes to prevent conflicts
     * @param to Address to mint token to
     * @return tokenId The ID of the newly minted token
     */
    function mint(address to) public returns (uint256) {
        require(msg.sender == minter, "ConcurrentERC721: caller is not minter");
        require(to != address(0), "ConcurrentERC721: mint to zero address");

        // Generate unique token ID using Arcology's Runtime.uuid()
        // This is conflict-free in parallel execution (each call gets unique UUID)
        uint256 tokenId = uint256(keccak256(Runtime.uuid()));

        // WRITE-ONLY OPERATIONS (no reads after this point)

        // Set ownership (tokenId → owner as uint160)
        _owners.set(tokenId, uint256(uint160(to)));

        // Initialize balance cumulative if this is first token for this address
        if (address(_balances[to]) == address(0)) {
            _balances[to] = new U256Cumulative(0, type(uint256).max);
        }

        // Increment balance
        _balances[to].add(1);

        // Increment total supply
        _totalSupply.add(1);

        // Emit transfer event (mint from zero address)
        emit Transfer(address(0), to, tokenId);

        return tokenId;
    }

    // ============ Burning (Read-Then-Write Pattern) ============

    /**
     * @notice Burn an NFT
     * @dev Can be called by token owner or approved address
     * @dev CRITICAL: Read owner BEFORE any writes to prevent conflicts
     * @param tokenId Token ID to burn
     */
    function burn(uint256 tokenId) public {
        // READ PHASE: Get owner before any writes
        address owner = ownerOf(tokenId);

        // Verify authorization
        require(
            _isApprovedOrOwner(msg.sender, tokenId, owner),
            "ConcurrentERC721: caller is not owner nor approved"
        );

        // WRITE PHASE: All writes happen after reads complete

        // Delete ownership
        _owners.del(tokenId);

        // Decrement owner balance (must be initialized if they own a token)
        _balances[owner].sub(1);

        // Decrement total supply
        _totalSupply.sub(1);

        // Clear approvals
        delete _tokenApprovals[tokenId];

        // Emit transfer event (burn to zero address)
        emit Transfer(owner, address(0), tokenId);
    }

    // ============ Transfers (Read-Then-Write Pattern) ============

    /**
     * @notice Transfer token from one address to another
     * @dev CRITICAL: Read owner ONCE at start, then write-only operations
     * @param from Current owner address
     * @param to Recipient address
     * @param tokenId Token ID to transfer
     */
    function transferFrom(address from, address to, uint256 tokenId) public {
        // READ PHASE: Get owner before any writes
        address owner = ownerOf(tokenId);

        // Verify 'from' matches actual owner
        require(owner == from, "ConcurrentERC721: transfer from incorrect owner");

        // Verify authorization
        require(
            _isApprovedOrOwner(msg.sender, tokenId, owner),
            "ConcurrentERC721: transfer caller is not owner nor approved"
        );

        // Verify recipient is valid
        require(to != address(0), "ConcurrentERC721: transfer to zero address");

        // WRITE PHASE: All writes happen after reads complete

        // Update ownership
        _owners.set(tokenId, uint256(uint160(to)));

        // Decrement sender balance (must be initialized if they own a token)
        _balances[from].sub(1);

        // Initialize recipient balance if needed
        if (address(_balances[to]) == address(0)) {
            _balances[to] = new U256Cumulative(0, type(uint256).max);
        }

        // Increment recipient balance
        _balances[to].add(1);

        // Clear approvals
        delete _tokenApprovals[tokenId];

        // Emit transfer event
        emit Transfer(from, to, tokenId);
    }

    /**
     * @notice Safe transfer with receiver check
     * @param from Current owner address
     * @param to Recipient address
     * @param tokenId Token ID to transfer
     */
    function safeTransferFrom(address from, address to, uint256 tokenId) public {
        safeTransferFrom(from, to, tokenId, "");
    }

    /**
     * @notice Safe transfer with receiver check and data
     * @param from Current owner address
     * @param to Recipient address
     * @param tokenId Token ID to transfer
     * @param data Additional data to pass to receiver
     */
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public {
        transferFrom(from, to, tokenId);

        // Check if recipient is a contract
        if (to.code.length > 0) {
            // Call onERC721Received if recipient is a contract
            try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
                require(
                    retval == IERC721Receiver.onERC721Received.selector,
                    "ConcurrentERC721: transfer to non ERC721Receiver implementer"
                );
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert("ConcurrentERC721: transfer to non ERC721Receiver implementer");
                } else {
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        }
    }

    // ============ Approvals (Standard Mappings - Conflict-Safe) ============

    /**
     * @notice Approve an address to transfer a specific token
     * @param to Address to approve
     * @param tokenId Token ID to approve
     */
    function approve(address to, uint256 tokenId) public {
        address owner = ownerOf(tokenId);

        require(to != owner, "ConcurrentERC721: approval to current owner");
        require(
            msg.sender == owner || isApprovedForAll(owner, msg.sender),
            "ConcurrentERC721: approve caller is not owner nor approved for all"
        );

        _tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    /**
     * @notice Approve or revoke approval for an operator to manage all tokens
     * @param operator Operator address
     * @param approved True to grant approval, false to revoke
     */
    function setApprovalForAll(address operator, bool approved) public {
        require(operator != msg.sender, "ConcurrentERC721: approve to caller");

        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    // ============ Internal Helpers ============

    /**
     * @notice Check if token exists
     * @param tokenId Token ID to check
     * @return bool True if token exists
     */
    function _exists(uint256 tokenId) internal returns (bool) {
        return _owners.get(tokenId) != 0;
    }

    /**
     * @notice Check if spender is authorized to manage a token
     * @param spender Address to check
     * @param tokenId Token ID to check
     * @param owner Token owner (passed to avoid redundant ownerOf call)
     * @return bool True if spender is owner or approved
     */
    function _isApprovedOrOwner(address spender, uint256 tokenId, address owner) internal returns (bool) {
        return (
            spender == owner ||
            getApproved(tokenId) == spender ||
            isApprovedForAll(owner, spender)
        );
    }
}

/**
 * @title IERC721Receiver
 * @notice Interface for contracts that want to receive ERC-721 tokens via safe transfers
 */
interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}
