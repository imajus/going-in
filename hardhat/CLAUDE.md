# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Development Commands

**Local Development:**

- `npm run chain` - Start local Hardhat node on localhost:8545
- `npm run compile` - Compile Solidity contracts and generate ABIs in ./abi/
- `npm run deploy` - Build contracts and Deploy to default network (localhost)
- `npm run build` - Build browser-compatible contracts file for frontend integration

### Deployment & ABI Management

**Hardhat Ignition:** Uses modules in `ignition/modules/` for deterministic deployments
**ABI Export:** Auto-generates ABIs to `./abi/` on compilation for frontend consumption
**Contract Distribution:** `build-contracts.js` creates `dist/contracts.js` with deployment addresses and ABIs for browser integration

## Code Style & Conventions

**Solidity (^0.8.20)**

- Imports: OpenZeppelin contracts first, then local files
- Naming: PascalCase for contracts/structs, camelCase for functions/variables, UPPER_CASE for constants
- Security: Use modifiers for access control, checks-effects-interactions pattern, ReentrancyGuard
- Events: Emit for all state changes, indexed parameters for filtering
- Gas: Pack struct variables, use mappings over arrays, batch operations

**JavaScript (ES Modules)**

- Use ES6 imports: `import { buildModule } from '@nomicfoundation/hardhat-ignition/modules'`
- Async/await for contract interactions
- Error handling: Try-catch blocks for contract calls, revert reason strings
- Deployment: Use Hardhat Ignition modules in ignition/modules/

## Special Instructions

- Never start local network with `npx hardhat node` or `npm run chain`
