## Overview

**Goin In!** is a blockchain-based parallel ticketing system built for Arcology Network. This project leverages Arcology's parallel execution capabilities to achieve 10,000+ TPS, solving catastrophic failures in traditional ticketing platforms.

The system uses atomic payment and ticket delivery with Arcology's concurrent structures (U256Cumulative), making duplicate sales and "charged but no ticket" scenarios mathematically impossible.

### The Story

When Jennifer Lopez tickets went on sale in Kazakhstan in April 2025, 25,000 fans watched their screens freeze for four hours. The platform controlling 90% of the country's ticketing market simply collapsed.
When it finally recovered, people discovered they'd been charged for tickets that didn't exist, while others received duplicate tickets for the same seats. The CEO spent the entire night manually sorting through the chaos.

This wasn't an isolated incident—when Taylor Swift announced her tour, Ticketmaster received 3.5 billion requests and had to cancel the public sale entirely. When Coldplay tickets went on sale in India, BookMyShow crashed within 10 minutes with a 1.3% success rate.

### The Problem

These failures happen because traditional ticketing platforms run on centralized servers built for moderate traffic, not millions of people clicking "buy" at the exact same moment. The architecture is fundamentally incapable of scaling to meet demand during the critical minutes when tickets go on sale. Even worse, when systems crash, the aftermath is catastrophic: phantom charges, duplicate sales, and zero accountability for the platforms despite threatening tens of millions of dollars in events.

### The Solution

**Goin' In!** solves this by leveraging **blockchain technology**. The blockchain approach delivers mathematical guarantees impossible with traditional platforms. Payment and ticket delivery happen atomically in a single transaction - you either get both or neither, making "charged but no ticket" scenarios physically impossible. Each ticket exists as a unique digital token with exactly one owner, eliminating duplicate sales by design.

**Goin' In!** scales with **parallel transaction** execution, which addresses Ethereum's well-known congestion problem. While traditional blockchains process transactions one at a time like a single checkout line, parallel execution processes thousands simultaneously like having countless checkout lanes open at once. This means when thousands of fans hit "buy" at the same moment, the system processes all those requests in parallel rather than queuing them sequentially.

When Kazakhstan's system crashed, the CEO admitted they created "a mass of incorrectly booked orders" - on blockchain, this can't happen because the protocol itself enforces correctness.

## How It's Made

**Backend**: Smart contracts built with **Solidity 0.8.19** deployed on Arcology Network, an EVM-compatible blockchain with parallel execution capabilities. The system uses **Hardhat v3** as the development framework with Ignition for deterministic deployments.

**Frontend**: React 18 + Vite build system with ethers.js v6 for blockchain interaction, styled with TailwindCSS v4. The architecture uses npm workspaces as a monorepo structure separating contracts and frontend.

### Arcology Parallel Execution Implementation

The project's core innovation leverages **Arcology's concurrent library** to achieve conflict-free parallel transaction processing.

Each purchase involves three contracts (ERC-20 payment, TicketingCore logic, ERC-721 minting) executing atomically. Arcology's parallel executor processes these complex transactions simultaneously across multiple users without serialization bottlenecks.

See more details on this [here](./docs/integrations/arcology.md).

### Hardhat 3 Testing Strategy

Hardhat 3's **native Solidity testing** framework is used for standard contract logic—deployment, access control, time-locked withdrawals, and basic validation.

**Hardhat Ignition** is used for smart contract deployment management.

See more details on this [here](./docs/integrations/hardhat.md).

### Envio HyperIndex Integration

The project uses Envio **HyperIndex v2.31.0** to provide a real-time GraphQL API for querying blockchain state without expensive RPC calls or client-side filtering.

See more details in this [here](./docs/integrations/envio.md).

### Disclamer

Due to a [bug](https://github.com/arcology-network/main/issues/11) in Arcology DevNet implementation, rollbacked transactions are still triggering events, which may result in an inaccurate number of purchased tickets displayed in the frontend. However, based on my tests, the integrity of the smart contract data is preserved.

## Prerequisites for Development

- Node.js v20+ and npm
- Access to Arcology DevNet (remote node at http://arco.vps.webdock.cloud:8545)
- Deployed smart contracts with ABIs exported

## Running this project

To run this project locally, follow these steps:

1. Clone the project locally, change into the directory, and install the dependencies:

```sh
git clone <repository-url>
cd going-in
nvm use # Optional, but recommended
npm install
```

2. Deploy contracts to Arcology DevNet:

```sh
npm run deploy --workspace=hardhat
```

3. Configure frontend environment variables (optional):

```sh
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your project IDs
```

4. Start the Vite development server:

```sh
npm run dev --workspace=frontend
```

The frontend will be available at http://localhost:8080

## Development Workflow

When working with smart contracts, follow this development flow:

1. **Create/update smart contract** in the `hardhat/contracts/` folder
2. **Create/update deployment script** in `hardhat/scripts/` (see `deploy.js` example)
3. **Compile contracts**: `npm run compile --workspace=hardhat` (generates ABIs in `hardhat/abi/`)
4. **Deploy contract**: `npm run deploy --workspace=hardhat`
   - Deployment script saves data to `hardhat/dist/{ContractName}.json`
   - Format: `{ address, abi, chainId, network, deployedAt }`

After deployment, contract data is automatically available to the frontend via the `ethereum-scaffold-contracts` package:

```javascript
import { getDeployment } from 'ethereum-scaffold-contracts';

const { address, abi } = getDeployment('ContractName');
const contract = new ethers.Contract(address, abi, signer);
```

### Available Scripts

#### Hardhat

- `npm run compile --workspace=hardhat` - Compile smart contracts
- `npm run deploy --workspace=hardhat` - Deploy contracts to Arcology DevNet
- `npm run monitor --workspace=hardhat` - Monitor Arcology DevNet status

#### Frontend

- `npm run dev --workspace=frontend` - Start Vite development server (port 8080)
- `npm run build --workspace=frontend` - Build Vite application for production
- `npm run build:dev --workspace=frontend` - Build for development/testing
- `npm run start --workspace=frontend` - Preview production build
- `npm run lint --workspace=frontend` - Run ESLint

### Project Structure

```
hardhat/
├── contracts/         # Solidity smart contracts
├── ignition/          # Hardhat Ignition deployment modules
│   └── modules/
├── test/              # Contract tests (JavaScript)
├── scripts/           # Deployment scripts
├── dist/              # Deployment data (auto-generated on deploy)
├── abi/               # Contract ABIs (auto-generated on compile)
├── hardhat.config.js  # Hardhat configuration
└── index.js           # Package exports

frontend/
├── src/
│   ├── components/
│   │   ├── Navigation.tsx     # Main navigation
│   │   └── ui/                # shadcn/ui components (50+)
│   ├── pages/                 # Page components (TypeScript)
│   │   ├── Home.tsx           # Landing page
│   │   ├── CreateEvent.tsx    # Event creation
│   │   ├── EventDetails.tsx   # Event details
│   │   ├── MyTickets.tsx      # User tickets
│   │   ├── Dashboard.tsx      # Organizer dashboard
│   │   └── NotFound.tsx       # 404 page
│   ├── hooks/                 # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── lib/                   # Utilities
│   │   ├── contracts.js       # Contract utilities
│   │   └── utils.ts           # Helper functions
│   ├── App.tsx                # Main application
│   ├── main.tsx               # React entry point
│   └── index.css              # Global styles
├── public/
│   ├── background.mp4         # Hero video
│   └── favicon.ico
├── components.json            # shadcn/ui config
├── tailwind.config.ts         # TailwindCSS config
├── tsconfig.json              # TypeScript config
├── eslint.config.js           # ESLint config
└── vite.config.ts             # Vite configuration
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

#### Network Configuration

The project is configured to deploy to Arcology DevNet by default:

- **Network**: Arcology DevNet
- **RPC URL**: http://arco.vps.webdock.cloud:8545
- **Chain ID**: 118
- Deployment artifacts are stored in `hardhat/ignition/deployments/chain-118/`

To deploy to other networks, update network configurations in `hardhat/hardhat.config.js`

### Technology Stack

**Frontend:**

- **Language**: TypeScript 5.8
- **Framework**: React 18 with React Router v6
- **Build Tool**: Vite 5.4 with SWC plugin
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: TailwindCSS v3 with custom theme
- **State Management**: @tanstack/react-query
- **Forms**: react-hook-form + zod validation
- **Icons**: lucide-react
- **Notifications**: sonner (toast library)
- **Theming**: next-themes for dark/light mode

**Blockchain:**

- **Network**: Arcology Network (parallel execution blockchain)
- **Library**: Ethers.js v6
- **Wallet**: Reown AppKit (formerly WalletConnect)
- **Smart Contracts**: Solidity 0.8.19
- **Concurrent Library**: @arcologynetwork/concurrentlib v2.2.0
- **Security**: OpenZeppelin Contracts v5.4.0
- **Development**: Hardhat v3 + Ignition deployment system
