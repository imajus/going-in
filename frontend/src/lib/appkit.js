import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { hardhat } from '@reown/appkit/networks';

// 1. Get projectId from environment variables
const projectId = import.meta.env.VITE_REOWN_PROJECT_ID;

const networks = [hardhat];

// 3. Create a metadata object - optional
const metadata = {
  name: 'NFT Marketplace',
  description: 'Metaverse NFT Marketplace',
  url:
    typeof window !== 'undefined'
      ? window.location.origin
      : 'http://localhost:3000',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

// 4. Create Ethers Adapter
const ethersAdapter = new EthersAdapter();

// 5. Create modal
const modal = createAppKit({
  adapters: [ethersAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: false, // Optional - defaults to your Cloud configuration
  },
});

export default modal;
