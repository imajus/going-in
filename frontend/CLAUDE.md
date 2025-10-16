# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Test/Lint Commands

- `npm run dev` - Start Vite development server on port 5173
- `npm run build` - Production build to `dist/`
- `npm run start` - Preview production build locally
- `npm run lint` - ESLint with max-warnings 0 (strict mode)

## Prerequisites for Development

- Node.js v20+ and npm
- Running Arcology network or local development node: `npm run chain` (from hardhat directory)
- Deployed smart contracts with ABIs and addresses exported: `npm run deploy` (from hardhat directory)

## Architecture Overview

### Web3 Integration Stack

- **Wallet**: Reown AppKit (formerly WalletConnect)
- **Blockchain**: Ethers.js v6 for contract interactions
- **Contracts**: Dynamic loading via `ethereum-scaffold-contracts` package from hardhat project
- **Storage**: IPFS for metadata and images

### Core Application Flow

1. **Contract Discovery**: `src/lib/contracts.js` loads contract ABIs and addresses using `getDeployment(contractName)` from the `ethereum-scaffold-contracts` package (hardhat workspace)

### Data Dependencies

- Contract deployment data imported from `ethereum-scaffold-contracts` package (hardhat workspace)
- Each contract has: `{ address: "0x...", abi: [...] }`
- Data sourced from `hardhat/dist/{ContractName}.json` files created by deployment scripts
- No local ABI storage - all contract data comes from hardhat workspace exports

### Hardhat Module API

The hardhat workspace exports these functions via `ethereum-scaffold-contracts`:

- `getDeployment(contractName)` - Returns `{ address, abi }` for a specific contract
- `getDeployments()` - Returns object with all contracts: `{ ContractName: { address, abi }, ... }`
- `getDeploymentNames()` - Returns array of deployed contract names

## Code Conventions

- ES modules only, no React import needed (new JSX transform)
- Functional components with hooks, PascalCase naming
- camelCase for variables/functions
- Try/catch with console.error and user-friendly error messages
- Show loading states during async operations
- JSDoc comments for type hints (no TypeScript)
