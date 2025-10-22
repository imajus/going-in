import { ethers } from 'ethers';
import { getDeployment } from 'ethereum-scaffold-contracts';
import type {
  TicketingCore,
  ConcurrentERC721,
  ConcurrentERC20,
} from 'ethereum-scaffold-contracts/types';

/**
 * Get default provider based on environment configuration
 */
export function getDefaultProvider() {
  const hardhatRpcUrl =
    import.meta.env.VITE_HARDHAT_RPC_URL || 'http://localhost:8545';
  // Default to local hardhat network
  return new ethers.JsonRpcProvider(hardhatRpcUrl);
}

/**
 * Get TicketingCore contract instance
 * @param runner - Ethereum provider or signer
 * @returns Typed TicketingCore contract instance
 */
export function getTicketingCore(runner: ethers.ContractRunner): TicketingCore {
  try {
    const { abi, address } = getDeployment('TicketingCore');
    return new ethers.Contract(address, abi, runner) as unknown as TicketingCore;
  } catch (error) {
    console.error('Error loading TicketingCore contract:', error);
    throw error;
  }
}

/**
 * Get ConcurrentERC721 contract instance
 * @param contractAddress - Address of the NFT contract
 * @param runner - Ethereum provider or signer
 * @returns Typed ConcurrentERC721 contract instance
 */
export function getConcurrentERC721(
  contractAddress: string,
  runner: ethers.ContractRunner
): ConcurrentERC721 {
  try {
    const { abi } = getDeployment('ConcurrentERC721');
    return new ethers.Contract(contractAddress, abi, runner) as unknown as ConcurrentERC721;
  } catch (error) {
    console.error('Error loading ConcurrentERC721 contract:', error);
    throw error;
  }
}

/**
 * Get ConcurrentERC20 contract instance (payment token)
 * @param runner - Ethereum provider or signer
 * @returns Typed ConcurrentERC20 contract instance
 */
export function getConcurrentERC20(runner: ethers.ContractRunner): ConcurrentERC20 {
  try {
    const { abi, address } = getDeployment('ConcurrentERC20');
    return new ethers.Contract(address, abi, runner) as unknown as ConcurrentERC20;
  } catch (error) {
    console.error('Error loading ConcurrentERC20 contract:', error);
    throw error;
  }
}
