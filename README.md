## Overview

This is an Ethereum NFT Marketplace scaffold built with Solidity, IPFS, React & Vite with modern tooling including Hardhat v3 & Ignition deployment system.

## Prerequisites for Development

- Node.js v20+ and npm
- Running Hardhat node (from `../hardhat` directory)
- Deployed smart contracts with ABIs exported

## Running this project

To run this project locally, follow these steps:

1. Clone the project locally, change into the directory, and install the dependencies:

```sh
git clone <repository-url>
cd ethereum-scaffold
nvm use # Optional, but recommended
npm install
```

2. Start the local Hardhat node:

```sh
npm run chain --workspace=hardhat
```

3. Deploy contracts and build exports (in a separate terminal):

```sh
npm run deploy --workspace=hardhat
npm run build --workspace=hardhat
```

4. Configure frontend environment variables (optional):

```sh
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your project IDs
```

5. Start the Vite development server:

```sh
npm run dev --workspace=frontend
```

## Development Workflow

When working with smart contracts, follow this development flow:

1. **Create/update smart contract** in the `/contracts` folder
2. **Update deployment module** in `/ignition/modules/` using Hardhat Ignition
3. **Compile contracts**: `npm run compile --workspace=hardhat`
4. **Deploy contracts**: `npm run deploy --workspace=hardhat`
5. **Build exports**: `npm run build --workspace=hardhat`

After running these commands, the contract artifacts will be available for importing from `ethereum-scaffold-hardhat` module.

### Available Scripts

#### Hardhat

- `npm run chain --workspace=hardhat` - Start local Hardhat node
- `npm run compile --workspace=hardhat` - Compile smart contracts
- `npm run deploy:test --workspace=hardhat` - Deploy contracts using Hardhat Ignition to Hardhat virtual network
- `npm run deploy --workspace=hardhat` - Deploy contracts using Hardhat Ignition to default network (localhost)
- `npm run build --workspace=hardhat` - Build contract exports

### Frontend

- `npm run build --workspace=frontend` - Build Vite application for production
- `npm run dev --workspace=frontend` - Start Vite development server
- `npm run start --workspace=frontend` - Preview production build
- `npm run lint --workspace=frontend` - Run ESLint

### Project Structure

```
hardhat/
└──contracts/          # Smart contracts
   └── NFTMarketplace.sol

   ignition/           # Hardhat Ignition deployment
   ├── modules/
   │   └── NFTMarketplace.js
   └── deployments/    # Deployment artifacts

   hardhat.config.js   # Hardhat configuration

frontend/
└──src/                # Frontend source code
   ├── components/     # React components
   │   └── Navigation.jsx
   ├── pages/          # Page components
   │   ├── Home.jsx
   │   ├── CreateNFT.jsx
   │   ├── Dashboard.jsx
   │   ├── MyNFTs.jsx
   │   └── ResellNFT.jsx
   ├── lib/            # Utility libraries
   │   ├── appkit.js   # Wallet connection
   │   └── contracts.js # Contract utilities
   ├── abi/            # Contract ABIs
   ├── styles/         # CSS styles
   └── App.jsx         # Main application

   vite.config.js      # Vite configuration
```

### Configuration

#### Environment Variables (Frontend)

Create a `.env` file from the example:

```sh
cp frontend/.env.example frontend/.env
```

Configure the following variables:

- `VITE_REOWN_PROJECT_ID` - Get from [Reown Dashboard](https://dashboard.reown.com) for wallet connection
- `VITE_HARDHAT_RPC_URL`

#### Network Deployment

To deploy to other networks:

1. Update network configurations in `hardhat/hardhat.config.js`
2. Set up private keys securely (use environment variables or Hardhat accounts)
3. Configure RPC endpoints (Infura, Alchemy, etc.)
4. Deploy with: `npm run deploy --workspace=hardhat -- --network <network-name>`

### Technology Stack

- **Frontend**: React 18 + Vite + TailwindCSS
- **Routing**: React Router v6
- **Wallet**: Reown AppKit (formerly WalletConnect)
- **Blockchain**: Ethers.js v6
- **Smart Contracts**: Solidity 0.8.20 + OpenZeppelin
- **Development**: Hardhat v3 + Ignition deployment
- **Storage**: IPFS for metadata and images
