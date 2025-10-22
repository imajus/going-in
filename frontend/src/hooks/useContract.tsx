import { useMemo } from 'react';
import { ethers } from 'ethers';
import { useWallet } from './useWallet';
import {
  getTicketingCore,
  getConcurrentERC20,
  getConcurrentERC721,
} from '@/lib/contracts';
import { getReadOnlyProvider } from '@/lib/web3';
import type {
  TicketingCore,
  ConcurrentERC20,
  ConcurrentERC721,
} from 'ethereum-scaffold-contracts/types';

/**
 * Hook to get TicketingCore contract instance
 * @param withSigner - If true, returns contract with signer for transactions
 * @returns TicketingCore contract instance
 */
export function useTicketingCore(withSigner: boolean = false): TicketingCore {
  const { signer, isConnected } = useWallet();

  return useMemo(() => {
    if (withSigner && isConnected && signer) {
      return getTicketingCore(signer);
    }
    // Return read-only instance
    return getTicketingCore(getReadOnlyProvider());
  }, [withSigner, isConnected, signer]);
}

/**
 * Hook to get ConcurrentERC20 contract instance (payment token)
 * @param withSigner - If true, returns contract with signer for transactions
 * @returns ConcurrentERC20 contract instance
 */
export function usePaymentToken(withSigner: boolean = false): ConcurrentERC20 {
  const { signer, isConnected } = useWallet();

  return useMemo(() => {
    if (withSigner && isConnected && signer) {
      return getConcurrentERC20(signer);
    }
    // Return read-only instance
    return getConcurrentERC20(getReadOnlyProvider());
  }, [withSigner, isConnected, signer]);
}

/**
 * Hook to get ConcurrentERC721 contract instance (tier NFT)
 * @param nftAddress - Address of the tier NFT contract
 * @param withSigner - If true, returns contract with signer for transactions
 * @returns ConcurrentERC721 contract instance or null if no address
 */
export function useTierNFT(
  nftAddress: string | null,
  withSigner: boolean = false
): ConcurrentERC721 | null {
  const { signer, isConnected } = useWallet();

  return useMemo(() => {
    if (!nftAddress) {
      return null;
    }

    if (withSigner && isConnected && signer) {
      return getConcurrentERC721(nftAddress, signer);
    }
    // Return read-only instance
    return getConcurrentERC721(nftAddress, getReadOnlyProvider());
  }, [nftAddress, withSigner, isConnected, signer]);
}

/**
 * Hook to get generic contract instance
 * @param address - Contract address
 * @param abi - Contract ABI
 * @param withSigner - If true, returns contract with signer for transactions
 * @returns Contract instance
 */
export function useContractInstance(
  address: string,
  abi: any[],
  withSigner: boolean = false
): ethers.Contract {
  const { signer, isConnected } = useWallet();

  return useMemo(() => {
    if (withSigner && isConnected && signer) {
      return new ethers.Contract(address, abi, signer);
    }
    // Return read-only instance
    return new ethers.Contract(address, abi, getReadOnlyProvider());
  }, [address, abi, withSigner, isConnected, signer]);
}
