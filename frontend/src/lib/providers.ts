import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { hardhat } from 'viem/chains';

// Create public client with detailed error handling
export const publicClient = createPublicClient({
  chain: hardhat,
  transport: http('http://localhost:8545'),
  batch: {
    multicall: {
      batchSize: 1024,
      wait: 16,
    },
  },
  pollingInterval: 1000,
});

// Create wallet client with MetaMask
export const walletClient = createWalletClient({
  chain: hardhat,
  transport: window.ethereum ? custom(window.ethereum) : http('http://localhost:8545'),
});

// Optional: Create a wrapper function to handle provider checks
export const getProvider = () => {
  try {
    if (!window.ethereum) {
      console.warn('No Ethereum provider found. Falling back to HTTP provider.');
      return http('http://localhost:8545');
    }
    return custom(window.ethereum);
  } catch (error) {
    console.error('Provider initialization error:', error);
    return http('http://localhost:8545');
  }
};
