import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {
  connectWallet as connectWalletUtil,
  getCurrentAccount,
  getWalletProvider,
  switchToArcologyNetwork,
  ARCOLOGY_NETWORK,
} from '@/lib/web3';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  chainId: number | null;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    isConnected: false,
    isConnecting: false,
    provider: null,
    signer: null,
    chainId: null,
  });

  // Initialize wallet connection on mount
  useEffect(() => {
    const initWallet = async () => {
      const account = await getCurrentAccount();
      if (account) {
        await updateWalletState();
      }
    };

    initWallet();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.ethereum) {
      return;
    }

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // Wallet disconnected
        setState({
          address: null,
          isConnected: false,
          isConnecting: false,
          provider: null,
          signer: null,
          chainId: null,
        });
      } else {
        // Account changed
        updateWalletState();
      }
    };

    const handleChainChanged = () => {
      // Reload page on chain change (recommended by MetaMask)
      window.location.reload();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  // Update wallet state
  const updateWalletState = async () => {
    const provider = getWalletProvider();
    if (!provider) {
      return;
    }

    try {
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();

      setState({
        address,
        isConnected: true,
        isConnecting: false,
        provider,
        signer,
        chainId: Number(network.chainId),
      });
    } catch (error) {
      console.error('Error updating wallet state:', error);
      setState((prev) => ({ ...prev, isConnecting: false }));
    }
  };

  // Connect wallet
  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, isConnecting: true }));

    try {
      const address = await connectWalletUtil();
      if (address) {
        await updateWalletState();
      } else {
        throw new Error('Failed to connect wallet');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setState((prev) => ({ ...prev, isConnecting: false }));
      throw error;
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setState({
      address: null,
      isConnected: false,
      isConnecting: false,
      provider: null,
      signer: null,
      chainId: null,
    });
  }, []);

  // Switch to Arcology network
  const switchNetwork = useCallback(async () => {
    const success = await switchToArcologyNetwork();
    if (success) {
      await updateWalletState();
    }
    return success;
  }, []);

  // Check if on correct network
  const isCorrectNetwork = state.chainId === ARCOLOGY_NETWORK.chainId;

  return {
    ...state,
    connect,
    disconnect,
    switchNetwork,
    isCorrectNetwork,
  };
}
