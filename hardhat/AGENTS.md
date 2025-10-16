# AGENTS.md - Hardhat Smart Contract Development

## Build/Test Commands

- `npm run chain` - Start local Ethereum node
- `npm run compile` - Compile Solidity contracts & generate ABIs in ./abi/
- `npm run deploy` - Deploy to localhost network
- `npm run build` - Build browser-compatible contracts file for frontend integration

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
