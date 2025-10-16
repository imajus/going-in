import { ethers } from 'ethers';
import { getDeployment } from 'ethereum-scaffold-contracts';

/**
 * Get default provider based on environment configuration
 */
export function getDefaultProvider() {
  const hardhatRpcUrl =
    import.meta.env.VITE_HARDHAT_RPC_URL || 'http://127.0.0.1:8545';
  // Default to local hardhat network
  return new ethers.JsonRpcProvider(hardhatRpcUrl);
}

/**
 * Get NFT Marketplace contract instance
 * @param {ethers.ContractRunner} runner
 */
export async function getNFTMarketplace(runner) {
  try {
    const { abi, address } = getDeployment('NFTMarketplace');
    return new ethers.Contract(address, abi, runner);
  } catch (error) {
    console.error('Error loading NFTMarketplace contract:', error);
    throw error;
  }
}
