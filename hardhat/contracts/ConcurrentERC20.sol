// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@arcologynetwork/concurrentlib/lib/commutative/U256Cum.sol";

/**
 * @title ConcurrentERC20
 * @notice ERC20 token implementation using Arcology's concurrent structures for parallel-safe operations
 * @dev Based on Arcology's ds-token pattern with U256Cumulative for balance tracking
 * Reference: https://github.com/arcology-network/examples/blob/main/ds-token/contracts/Token.sol
 */
contract ConcurrentERC20 {
    // Token metadata
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;

    // Concurrent state variables
    U256Cumulative private _totalSupply;
    mapping(address => U256Cumulative) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    // Events per ERC20 standard
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    /**
     * @notice Constructor to initialize token with name, symbol, and initial supply
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _initialSupply Initial supply minted to contract deployer
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _initialSupply
    ) {
        name = _name;
        symbol = _symbol;

        // Initialize total supply with bounds [0, type(uint256).max]
        _totalSupply = new U256Cumulative(0, type(uint256).max);

        if (_initialSupply > 0) {
            // Initialize deployer balance
            _balances[msg.sender] = new U256Cumulative(0, type(uint256).max);

            // Mint initial supply to deployer
            _totalSupply.add(_initialSupply);
            _balances[msg.sender].add(_initialSupply);

            emit Transfer(address(0), msg.sender, _initialSupply);
        }
    }

    /**
     * @notice Get total token supply
     * @return Current total supply
     */
    function totalSupply() public view returns (uint256) {
        return _totalSupply.get();
    }

    /**
     * @notice Get balance of an account
     * @param account Address to query
     * @return Current balance
     */
    function balanceOf(address account) public view returns (uint256) {
        if (address(_balances[account]) == address(0)) {
            return 0;
        }
        return _balances[account].get();
    }

    /**
     * @notice Transfer tokens to another address
     * @param to Recipient address
     * @param amount Amount to transfer
     * @return success True if transfer succeeded
     */
    function transfer(address to, uint256 amount) public returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    /**
     * @notice Get allowance for spender
     * @param owner Token owner address
     * @param spender Spender address
     * @return Current allowance
     */
    function allowance(
        address owner,
        address spender
    ) public view returns (uint256) {
        return _allowances[owner][spender];
    }

    /**
     * @notice Approve spender to use tokens
     * @param spender Address to approve
     * @param amount Amount to approve
     * @return success True if approval succeeded
     */
    function approve(address spender, uint256 amount) public returns (bool) {
        require(spender != address(0), "ERC20: approve to zero address");

        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    /**
     * @notice Transfer tokens from one address to another using allowance
     * @param from Source address
     * @param to Destination address
     * @param amount Amount to transfer
     * @return success True if transfer succeeded
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public returns (bool) {
        uint256 currentAllowance = _allowances[from][msg.sender];
        require(currentAllowance >= amount, "ERC20: insufficient allowance");

        unchecked {
            _allowances[from][msg.sender] = currentAllowance - amount;
        }

        _transfer(from, to, amount);
        return true;
    }

    /**
     * @notice Public mint function for testing purposes
     * @dev In production, this should have access control
     * @param to Address to mint tokens to
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) public {
        require(to != address(0), "ERC20: mint to zero address");

        // Initialize balance if needed
        if (address(_balances[to]) == address(0)) {
            _balances[to] = new U256Cumulative(0, type(uint256).max);
        }

        // Update total supply and recipient balance atomically
        _totalSupply.add(amount);
        _balances[to].add(amount);

        emit Transfer(address(0), to, amount);
    }

    /**
     * @notice Internal transfer function using concurrent structures
     * @param from Source address
     * @param to Destination address
     * @param amount Amount to transfer
     */
    function _transfer(address from, address to, uint256 amount) internal {
        require(from != address(0), "ERC20: transfer from zero address");
        require(to != address(0), "ERC20: transfer to zero address");

        // Initialize sender balance if needed (should already exist)
        require(
            address(_balances[from]) != address(0),
            "ERC20: insufficient balance"
        );

        // Initialize recipient balance if needed
        if (address(_balances[to]) == address(0)) {
            _balances[to] = new U256Cumulative(0, type(uint256).max);
        }

        // Perform atomic balance updates
        // sub() will revert if balance falls below lower bound (0)
        _balances[from].sub(amount);
        _balances[to].add(amount);

        emit Transfer(from, to, amount);
    }
}
