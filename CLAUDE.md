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

# Deploy contracts to Arcology DevNet
npm run deploy --workspace=hardhat

# Start frontend dev server
npm run dev --workspace=frontend
```

### Common Development Workflow

**Smart Contract Development:**

```bash
# Compile contracts
npm run compile --workspace=hardhat

# Deploy using Hardhat Ignition
npm run deploy --workspace=hardhat

# Monitor Arcology DevNet status
npm run monitor --workspace=hardhat
```

**Frontend Development:**

```bash
# Start Vite dev server on port 8080
npm run dev --workspace=frontend

# Production build
npm run build --workspace=frontend

# Development build (for testing)
npm run build:dev --workspace=frontend

# Preview production build
npm run start --workspace=frontend

# Run ESLint
npm run lint --workspace=frontend
```

## Architecture Overview

### Smart Contract Layer (Planned Implementation)

The system is designed around three core Solidity contracts using Arcology's concurrent library:

1. **TicketingCore.sol** - Main event management contract

   - Dynamic tier structure per event (1-5 tiers recommended)
   - Parallel-safe ticket sales using U256Cumulative counters in dedicated mappings
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

### Frontend Architecture

- **Language**: TypeScript with path aliases (`@/` prefix for imports)
- **UI Framework**: React 18 with functional components
- **UI Components**: shadcn/ui (Radix UI primitives with TailwindCSS styling)
- **Icons**: lucide-react icon library
- **State Management**: @tanstack/react-query for server state
- **Forms**: react-hook-form with zod validation and @hookform/resolvers
- **Notifications**: sonner toast library
- **Theming**: next-themes for dark/light mode support
- **Web3 Integration**: Reown AppKit (formerly WalletConnect) for wallet connection
- **Blockchain Library**: ethers.js v6 with BrowserProvider for direct wallet connection
- **Contract Loading**: Dynamic ABI/address loading via `src/lib/contracts.ts` based on chainId
- **Routing**: React Router v6 for navigation
- **Styling**: TailwindCSS v3 with PostCSS and custom theme configuration

**Frontend File Structure:**

```
frontend/
├── src/
│   ├── components/
│   │   ├── Navigation.tsx          # Main navigation component
│   │   └── ui/                     # shadcn/ui components (50+ components)
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── form.tsx
│   │       └── ...                 # All shadcn/ui primitives
│   ├── hooks/
│   │   ├── use-mobile.tsx          # Mobile detection hook
│   │   └── use-toast.ts            # Toast notification hook
│   ├── lib/
│   │   ├── contracts.ts            # Contract ABI/address utilities
│   │   └── utils.ts                # Utility functions (cn, etc.)
│   ├── pages/
│   │   ├── Home.tsx                # Landing page with featured events
│   │   ├── CreateEvent.tsx         # Event creation form
│   │   ├── EventDetails.tsx        # Event details and ticket purchase
│   │   ├── MyTickets.tsx           # User's purchased tickets
│   │   ├── Dashboard.tsx           # Event organizer dashboard
│   │   └── NotFound.tsx            # 404 page
│   ├── App.tsx                     # Main app with routing setup
│   ├── main.tsx                    # React entry point
│   ├── index.css                   # Global styles with TailwindCSS
│   └── vite-env.d.ts               # Vite type definitions
├── public/
│   ├── background.mp4              # Hero section video background
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
├── components.json                 # shadcn/ui configuration
├── tailwind.config.ts              # TailwindCSS configuration
├── tsconfig.json                   # TypeScript root config
├── tsconfig.app.json               # TypeScript app config
├── tsconfig.node.json              # TypeScript Node config
├── eslint.config.js                # ESLint flat config
├── vite.config.ts                  # Vite configuration
└── package.json
```

**Data Flow:**

1. Deployment scripts save contract address + ABI to `hardhat/dist/{ContractName}.json`
2. Frontend imports contract data from `ethereum-scaffold-contracts` npm package (hardhat workspace)
3. Contract data accessed via `getDeployment(contractName)` function from hardhat module
4. No local ABI storage - all contract data comes from hardhat workspace exports

**Hardhat Module API:**

The hardhat workspace exports these functions via `ethereum-scaffold-contracts`:

- `getDeployment(contractName)` - Returns `{ address, abi }` for a specific contract
- `getDeployments()` - Returns object with all contracts: `{ ContractName: { address, abi }, ... }`
- `getDeploymentNames()` - Returns array of deployed contract names

**Deployment & ABI Management:**

- **Hardhat Ignition**: Uses modules in `hardhat/ignition/modules/` for deterministic deployments
- **ABI Extraction**: ABIs are extracted directly from deployed contract instances using `contract.interface.formatJson()`
- **Contract Distribution**: Deployment scripts create `hardhat/dist/{ContractName}.json` with deployment addresses and ABIs for browser integration

### Key Arcology-Specific Patterns

**Official Documentation:**

- **LLM-Friendly Arcology Docs**: https://docs.arcology.network/main/llms-full.txt - use this URL to fetch comprehensive Arcology-specific information when implementing concurrent contracts
- **Hardhat Solidity Testing Docs**: https://hardhat.org/docs/getting-started#solidity-tests

**Non-View Functions and Static Calls:**

Functions that read from Arcology concurrent structures (U256Map, U256Cumulative) **cannot** be marked as `view` because the underlying `get()` operations are not view functions. When calling these functions in tests or frontend code, use `.staticCall`:

```javascript
// WRONG - Returns ContractTransactionResponse, not the actual value
const owner = await nft.ownerOf(tokenId);

// CORRECT - Returns the actual address value
const owner = await nft.ownerOf.staticCall(tokenId);
```

**Common Non-View Functions in ConcurrentERC721:**

- `ownerOf(uint256 tokenId)` → use `.staticCall` to get address
- `getApproved(uint256 tokenId)` → use `.staticCall` to get address

**View Functions (normal usage):**

- `balanceOf(address owner)`
- `totalSupply()`
- `isApprovedForAll(address owner, address operator)`
- `name()`, `symbol()`, `supportsInterface(bytes4)`

**U256Cumulative Usage:**

- Thread-safe counter with bounds enforcement (0 to capacity)
- Used for: tier sold counts, event revenue, token balances, total supply tracking
- Enables conflict-free parallel execution of purchases

**Commutativity Requirements:**

- Avoid mixing reads (`fullLength()`) with concurrent writes (`.push()`)
- Use `committedLength()` for safe reads during parallel execution
- Separate read and write operations to prevent conflicts

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

**CRITICAL:** Hardhat Ignition **CANNOT** be used in tests. Always use `ethers.getContractFactory()` and `.deploy()` for test deployments.

**Native Testing**: Prefer native Solidity tests over JavaScript tests.

**CRITICAL CONSTRAINT:** Arcology's concurrent library operations (U256Cumulative, U256Map, etc.) **CANNOT** be tested using Solidity tests. All contract tests involving concurrent structures must be written in **JavaScript using Hardhat's testing framework**.

**Rationale:** Solidity tests run in a simulated EVM environment that doesn't support Arcology's parallel execution primitives. Only JavaScript tests running against actual Arcology nodes (local or DevNet) can properly validate concurrent behavior.

### Test Deployment Pattern

```javascript
// CORRECT - Use in tests
const ContractFactory = await ethers.getContractFactory('ContractName');
const contract = await ContractFactory.deploy(constructorArg1, constructorArg2);
await contract.waitForDeployment();

// WRONG - Never use in tests
const { contract } = await connection.ignition.deploy(ModuleName);
```

### Load Testing Requirements

**Simulation Parameters (from PRD):**

- 1000+ parallel purchases every 10 seconds
- Continue until 25,000 tickets sold
- 10% random refunds from previous batches
- Measure: TPS, gas per operation, conflict detection rate

**Implementation Approach:**

- Use Arcology's `@arcologynetwork/frontend-util` for parallel transaction generation
- Create parallel transactions using `frontendUtil.generateTx()` and `frontendUtil.waitingTxs()`
- Test with aggressive concurrency to validate parallel safety

## Technology Versions

**Critical Dependencies:**

- Node.js: >=20 (enforced in package.json engines)
- Solidity: 0.8.19 (main contracts), 0.4.18 (WETH9 legacy contract)
- Hardhat: ^3.0.4 with Ignition v3
- OpenZeppelin Contracts: ^5.4.0
- Arcology Concurrent Library: @arcologynetwork/concurrentlib@^2.2.0

**Frontend Dependencies:**

- TypeScript: ^5.8.3
- React: ^18.3.1
- React Router: ^6.30.1
- Vite: ^5.4.19 with @vitejs/plugin-react-swc
- ethers.js: ^6.15.0
- TailwindCSS: ^3.4.17
- shadcn/ui: Radix UI primitives (various ^1.x and ^2.x versions)
- @tanstack/react-query: ^5.83.0
- react-hook-form: ^7.61.1
- zod: ^3.25.76
- lucide-react: ^0.462.0
- sonner: ^1.7.4
- next-themes: ^0.3.0
- lodash-es: ^4.17.21

## Code Conventions

### Solidity (0.8.19)

- Compiler version: 0.8.19 with optimizer enabled (200 runs)
- Imports order: OpenZeppelin → Arcology → Local files
- Naming: PascalCase (contracts/structs), camelCase (functions/variables), UPPER_CASE (constants)
- Security pattern: Checks-effects-interactions
- Events: Emit for all state changes with indexed parameters
- Gas optimization: Struct packing, mappings over arrays, batch operations

### TypeScript/React

- ES modules only (type: "module" in all package.json files)
- TypeScript with relaxed compiler options (noImplicitAny: false, strictNullChecks: false)
- Path aliases: Use `@/` prefix for imports (e.g., `@/components/ui/button`)
- No React import needed (new JSX transform enabled)
- Functional components with hooks only
- PascalCase for components, camelCase for functions/variables
- TypeScript interfaces/types for complex data structures
- Error handling: try/catch with console.error and user-friendly messages
- Always show loading states during async blockchain operations
- Use shadcn/ui components for consistent UI (Button, Card, Badge, etc.)
- Forms: Use react-hook-form with zod schemas for validation

**shadcn/ui Component Usage:**

The frontend uses [shadcn/ui](https://ui.shadcn.com/) - a collection of re-usable components built with Radix UI and TailwindCSS. All UI components are located in `frontend/src/components/ui/`.

Available components include:

- Layout: Card, Dialog, Sheet, Tabs, Accordion, Collapsible, Separator
- Forms: Input, Textarea, Select, Checkbox, Switch, Radio Group, Form
- Buttons: Button, Toggle, Toggle Group
- Feedback: Alert, Alert Dialog, Toast, Sonner, Progress, Skeleton
- Navigation: Navigation Menu, Menubar, Breadcrumb, Pagination
- Data Display: Table, Badge, Avatar, Calendar, Chart
- Overlays: Popover, Hover Card, Tooltip, Context Menu, Dropdown Menu
- Media: Aspect Ratio, Carousel
- Utilities: Scroll Area, Resizable

Import components using the `@/` path alias:

```typescript
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
```

Component configuration is managed via `frontend/components.json`.

**TypeScript Configuration:**

The project uses a relaxed TypeScript configuration for rapid development:

- `noImplicitAny: false` - Allows implicit any types
- `strictNullChecks: false` - Relaxed null checking
- `noUnusedParameters: false` - Allows unused parameters
- `noUnusedLocals: false` - Allows unused local variables
- `allowJs: true` - Allows JavaScript files

Three TypeScript config files:

- `tsconfig.json` - Root config with path aliases and project references
- `tsconfig.app.json` - Application source code configuration
- `tsconfig.node.json` - Node.js/Vite configuration scripts

## Project Documentation

**Key Documents:**

- `CLAUDE.md`: This file - complete development guide for Claude Code
- `PRD.md`: Complete technical requirements and architecture
- `docs/motivation.md`: Problem statement (ticketing platform failures)
- `docs/solution.md`: Why blockchain + Arcology solves the problem
- `docs/user-stories.md`: Feature requirements with journey maps

## Common Pitfalls

1. **Arcology Concurrency Violations**: Reading array length during concurrent pushes causes conflicts
2. **Non-Atomic Operations**: Payment and NFT mint must be in same transaction
3. **U256Cumulative in Structs**: Never include U256Cumulative fields in structs that need to be returned to frontend - use separate mappings instead
4. **Refund Deadline**: Frontend must enforce 12-hour cutoff before event timestamp
5. **Contract Deployment Synchronization**: After contract changes, re-run deployment scripts to update dist/{ContractName}.json files for frontend consumption

## Network Configuration

**Current Setup:**

- **Arcology DevNet**: `http://arco.vps.webdock.cloud:8545` (Chain ID: 118)
- Default network in hardhat.config.js: `arcology`
- Pre-configured test accounts with private keys in config

**Network Details:**

- All contracts deploy to the remote Arcology DevNet
- No local node required - DevNet is accessible at all times
- Deployment artifacts stored in `hardhat/ignition/deployments/chain-118/`
- Monitor DevNet health: `npm run monitor --workspace=hardhat`
- When debugging tests, use --grep argument to execute the test you are working on in isolation.
- Use lodash-es helper functions when applicable, e.g. times()
