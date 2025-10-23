import { ethers } from 'ethers';

/**
 * Extend Window interface to include ethereum provider
 */
declare global {
  interface Window {
    ethereum?: any;
  }
}

/**
 * Arcology Network Configuration
 */
export const ARCOLOGY_NETWORK = {
  chainId: 118,
  chainIdHex: '0x76',
  name: 'Arcology DevNet',
  rpcUrl: import.meta.env.VITE_HARDHAT_RPC_URL || 'http://localhost:8545',
  nativeCurrency: {
    name: 'Arcology',
    symbol: 'ARCO',
    decimals: 18,
  },
  blockExplorerUrl: null,
};

/**
 * Get provider from window.ethereum (MetaMask or other wallet)
 * @returns BrowserProvider instance
 */
export function getWalletProvider(): ethers.BrowserProvider | null {
  if (typeof window === 'undefined' || !window.ethereum) {
    return null;
  }
  return new ethers.BrowserProvider(window.ethereum);
}

/**
 * Get read-only provider for Arcology Network
 * @returns JsonRpcProvider instance
 */
export function getReadOnlyProvider(): ethers.JsonRpcSigner {
  //XXX: Using fake signer here because function calls fail otherwise
  const provider = new ethers.JsonRpcProvider(ARCOLOGY_NETWORK.rpcUrl);
  return new ethers.JsonRpcSigner(
    provider,
    '0xc8bc50ca2443f4ce0ebf1bc9396b7f53f62e9c13'
  );
}

/**
 * Request wallet connection
 * @returns Connected address or null if failed
 */
export async function connectWallet(): Promise<string | null> {
  const provider = getWalletProvider();
  if (!provider) {
    throw new Error('No wallet provider found. Please install MetaMask.');
  }

  try {
    const accounts = await provider.send('eth_requestAccounts', []);
    if (accounts.length === 0) {
      throw new Error('No accounts found');
    }

    // Check if we're on the correct network
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== ARCOLOGY_NETWORK.chainId) {
      await switchToArcologyNetwork();
    }

    return accounts[0];
  } catch (error) {
    console.error('Error connecting wallet:', error);
    return null;
  }
}

/**
 * Switch to Arcology Network
 */
export async function switchToArcologyNetwork(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.ethereum) {
    return false;
  }

  try {
    // First, try to add the chain (this is idempotent - won't fail if it already exists)
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: ARCOLOGY_NETWORK.chainIdHex,
            chainName: ARCOLOGY_NETWORK.name,
            rpcUrls: [ARCOLOGY_NETWORK.rpcUrl],
            nativeCurrency: ARCOLOGY_NETWORK.nativeCurrency,
          },
        ],
      });
      console.log('Arcology network added/updated successfully');
    } catch (addError: any) {
      // If the chain already exists, this will fail with error 4902 or -32602
      // We can ignore these errors and try to switch
      console.log(
        'Chain may already exist, attempting to switch...',
        addError.code
      );
    }

    // Then switch to it
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: ARCOLOGY_NETWORK.chainIdHex }],
    });

    console.log('Switched to Arcology network successfully');
    return true;
  } catch (error: any) {
    console.error('Error switching to Arcology network:', error);
    return false;
  }
}

/**
 * Get current connected account
 * @returns Current account address or null
 */
export async function getCurrentAccount(): Promise<string | null> {
  const provider = getWalletProvider();
  if (!provider) {
    return null;
  }

  try {
    const accounts = await provider.send('eth_accounts', []);
    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('Error getting current account:', error);
    return null;
  }
}

/**
 * Format address to shortened version (0x1234...5678)
 * @param address - Full address
 * @returns Shortened address
 */
export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTokenId(tokenId: bigint): string {
  const raw = tokenId.toString();
  return `#${raw.slice(0, 5)}...${raw.slice(-5)}`;
}
