# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Going-In** is a blockchain-based parallel ticketing system built for Arcology Network to solve catastrophic failures in traditional ticketing platforms (e.g., TicketMaster, TicketOn crashes during high-demand events). The system leverages Arcology's parallel execution capabilities to achieve 10,000+ TPS on production hardware.

**Key Innovation**: Atomic payment and ticket delivery using Arcology's concurrent structures (U256Cumulative), making duplicate sales and "charged but no ticket" scenarios mathematically impossible.

## Project Structure

This is an npm workspaces monorepo with two packages:

```
going-in/
├── hardhat/           # Smart contracts workspace (Solidity + Hardhat v3)
└── frontend/          # React frontend workspace (Vite + React + TailwindCSS)
```

## Development Commands

### Initial Setup

```bash
# From repository root
npm install

# Start local Hardhat node (terminal 1)
npm run chain --workspace=hardhat

# Deploy contracts and build exports (terminal 2)
npm run deploy --workspace=hardhat

# Start frontend dev server (terminal 3)
npm run dev --workspace=frontend
```

### Common Development Workflow

**Smart Contract Development:**

```bash
# Compile contracts (generates ABIs to hardhat/abi/)
npm run compile --workspace=hardhat

# Deploy contracts using deployment scripts
npx hardhat run scripts/deploy.js --network arcology
```

**Frontend Development:**

```bash
# Start Vite dev server on port 5173
npm run dev --workspace=frontend

# Production build
npm run build --workspace=frontend

# Preview production build
npm run start --workspace=frontend

# Run ESLint (strict: max-warnings 0)
npm run lint --workspace=frontend
```

## Architecture Overview

### Smart Contract Layer (Planned Implementation)

The system is designed around three core Solidity contracts using Arcology's concurrent library:

1. **TicketingCore.sol** - Main event management contract

   - Fixed 3-tier ticket structure per event (Premium/Standard/General)
   - Parallel-safe ticket sales using U256Cumulative for sold count tracking
   - Time-locked revenue withdrawals (after refund deadline: event time - 12 hours)
   - Atomic refund mechanism with NFT burning

2. **ConcurrentTicketNFT.sol** - Custom ERC-721 with Arcology concurrent structures

   - Lazy minting on purchase (NFTs minted only when bought, not pre-minted)
   - U256Cumulative for total supply tracking (parallel-safe)
   - Burn capability for refunds
   - Based on Arcology's parallel execution patterns

3. **ConcurrentERC20.sol** - Custom ERC-20 payment token
   - Follows Arcology's ds-token pattern from examples
   - U256Cumulative for balance tracking (enables parallel transfers)
   - Reference: https://github.com/arcology-network/examples/blob/main/ds-token/contracts/Token.sol

**Current Status**: The repository contains a basic NFT marketplace contract (NFTMarketplace.sol) as a scaffold. The actual ticketing system contracts need to be implemented according to the PRD.

### Frontend Architecture

- **Web3 Integration**: Reown AppKit (formerly WalletConnect) for wallet connection
- **Blockchain Library**: ethers.js v6 with BrowserProvider for direct wallet connection
- **Contract Loading**: Dynamic ABI/address loading via `src/lib/contracts.js` based on chainId
- **Routing**: React Router v6 for navigation
- **Styling**: TailwindCSS v4 with PostCSS

**Data Flow:**

1. Deployment scripts save contract address + ABI to `hardhat/dist/{ContractName}.json`
2. Frontend imports contract data from `ethereum-scaffold-contracts` npm package (hardhat workspace)
3. Contract data accessed via `getDeployment(contractName)` function from hardhat module
4. No local ABI storage - all contract data comes from hardhat workspace exports

### Key Arcology-Specific Patterns

**Official Documentation:**

- **LLM-Friendly Arcology Docs**: https://docs.arcology.network/main/llms-full.txt - use this URL to fetch comprehensive Arcology-specific information when implementing concurrent contracts
- **Hardhaat Solidity Testing Docs**: https://hardhat.org/docs/getting-started#solidity-tests

**U256Cumulative Usage:**

- Thread-safe counter with bounds enforcement (0 to capacity)
- Used for: tier sold counts, token balances, total supply tracking
- Enables conflict-free parallel execution of purchases

**Commutativity Requirements:**

- Avoid mixing reads (`fullLength()`) with concurrent writes (`.push()`)
- Use `committedLength()` for safe reads during parallel execution
- Separate read and write operations to prevent conflicts

**Fixed 3-Tier Structure:**

- Avoids dynamic array overhead for gas optimization
- Each tier has: capacity (uint256), price (uint256), sold (U256Cumulative)
- Allows flexible naming but fixed structure for parallel safety

## Critical Development Constraints

### Arcology Concurrent Library

**Must Use:**

- `U256Cumulative` for all counters that will be modified in parallel
- Arcology's concurrent array types for collections
- Commutativity-preserving operations only

**Must Avoid:**

- Standard Solidity counters (not parallel-safe)
- Reading `fullLength()` while others push to arrays
- Index-based access during modifications

### Security Requirements

1. **ReentrancyGuard**: All withdrawal and refund functions
2. **Time-based Access Control**: Refund deadline enforcement (12 hours before event)
3. **Integer Overflow Protection**: Solidity 0.8+ built-in (but use Cumulative bounds)
4. **Atomic Operations**: Payment ↔ Ticket delivery must be atomic (single transaction)

### Gas Optimization Targets

- Event deployment: <5M gas (main contract + NFT contract)
- Ticket purchase: <200k gas
- Refund: <150k gas
- Revenue withdrawal: <50k gas

## Testing Strategy

### Load Testing Requirements

**Simulation Parameters (from PRD):**

- 1000+ parallel purchases every 10 seconds
- Continue until 25,000 tickets sold
- 10% random refunds from previous batches
- Measure: TPS, gas per operation, conflict detection rate

**Implementation Approach:**

- Use Arcology's `Multiprocess` library for parallel job execution
- Create `LoadSimulator.sol` contract to batch transactions
- Test with aggressive concurrency to validate parallel safety

## Technology Versions

**Critical Dependencies:**

- Node.js: >=20 (enforced in package.json engines)
- Solidity: ^0.8.20
- Hardhat: ^3.0.4 with Ignition v3
- OpenZeppelin Contracts: ^5.4.0
- Arcology Concurrent Library: ^5.0.0 (to be added)
- ethers.js: ^6.15.0
- React: ^18.2.0
- Vite: ^7.1.3

## Code Conventions

### Solidity

- Imports order: OpenZeppelin → Arcology → Local files
- Naming: PascalCase (contracts/structs), camelCase (functions/variables), UPPER_CASE (constants)
- Security pattern: Checks-effects-interactions
- Events: Emit for all state changes with indexed parameters
- Gas optimization: Struct packing, mappings over arrays, batch operations

### JavaScript/React

- ES modules only (type: "module" in all package.json files)
- No React import needed (new JSX transform enabled)
- Functional components with hooks only
- PascalCase for components, camelCase for functions/variables
- JSDoc comments for type hints (no TypeScript)
- Error handling: try/catch with console.error and user-friendly messages
- Always show loading states during async blockchain operations

## Project Documentation

**Key Documents:**

- `PRD.md`: Complete technical requirements and architecture
- `docs/motivation.md`: Problem statement (ticketing platform failures)
- `docs/solution.md`: Why blockchain + Arcology solves the problem
- `docs/user-stories.md`: Feature requirements with journey maps
- `frontend/CLAUDE.md`: Frontend-specific development guide
- `hardhat/CLAUDE.md`: Smart contract development guide

## Common Pitfalls

1. **Arcology Concurrency Violations**: Reading array length during concurrent pushes causes conflicts
2. **Non-Atomic Operations**: Payment and NFT mint must be in same transaction
3. **Fixed Tier Assumption**: All events must have exactly 3 tiers (can have 0 capacity for unused tiers)
4. **Refund Deadline**: Frontend must enforce 12-hour cutoff before event timestamp
5. **Contract Deployment Synchronization**: After contract changes, re-run deployment scripts to update dist/{ContractName}.json files for frontend consumption

## Network Configuration

**Current Setup:**

- Default: Hardhat local network (localhost:8545)
- Target Production: Arcology Network (RPC to be configured)

**For Arcology Deployment:**

1. Update `hardhat/hardhat.config.js` with Arcology RPC endpoint
2. Configure network-specific gas settings
3. Set up private keys securely (use environment variables)
4. Test extensively on Arcology DevNet before mainnet

## Implementation Status

**Completed:**

- Project scaffold with npm workspaces
- Hardhat v3 + Ignition deployment setup
- React + Vite frontend with Web3 integration
- Basic NFT marketplace contract (placeholder)

**TODO (from PRD priorities):**

- Phase 1: Implement ConcurrentERC20, ConcurrentTicketNFT, TicketingCore contracts
- Phase 2: Build event creation UI, purchase flow with tier selection, dashboard
- Phase 3: Deploy to Arcology DevNet, implement load simulation, optimize gas
