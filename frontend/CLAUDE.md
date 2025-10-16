# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Test/Lint Commands

- `npm run dev` - Start Vite development server on port 5173
- `npm run build` - Production build to `dist/`
- `npm run start` - Preview production build locally
- `npm run lint` - ESLint with max-warnings 0 (strict mode)

## Prerequisites for Development

- Node.js v20+ and npm
- Running Hardhat node (from `../hardhat` directory): `npm run chain`
- Deployed smart contracts with ABIs exported: `npm run deploy && npm run build`

## Architecture Overview

### Web3 Integration Stack

- **Wallet**: Reown AppKit (formerly WalletConnect)
- **Blockchain**: Ethers.js v6 for contract interactions
- **Contracts**: Dynamic loading via `ethereum-scaffold-contracts` package from hardhat project
- **Storage**: IPFS for metadata and images

### Core Application Flow

1. **Contract Discovery**: `src/lib/contracts.js` dynamically loads contract ABIs and addresses based on chainId using `getDeployments()` from the hardhat module

### Data Dependencies

- Contract ABIs are imported as npm package from `../hardhat` project
- No ABI files stored locally - all come from `ethereum-scaffold-contracts` package

## Code Conventions

- ES modules only, no React import needed (new JSX transform)
- Functional components with hooks, PascalCase naming
- camelCase for variables/functions
- Try/catch with console.error and user-friendly error messages
- Show loading states during async operations
- JSDoc comments for type hints (no TypeScript)
