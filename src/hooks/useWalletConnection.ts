import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export interface WalletConnection {
  account: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  balance: string | null;
}

export const useWalletConnection = (): WalletConnection => {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);

  const connect = async () => {
    try {
      // Check if MetaMask is installed
      if (!(window as any).ethereum) {
        throw new Error('MetaMask not detected');
      }

      // Request account access
      const accounts = await (window as any).ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      // Set the first account
      const selectedAccount = accounts[0];
      setAccount(selectedAccount);

      // Get account balance
      const provider = new ethers.providers.Web3Provider((window as any).ethereum);
      const balance = await provider.getBalance(selectedAccount);
      setBalance(ethers.utils.formatEther(balance));

      // Add listener for account changes
      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
    } catch (error) {
      console.error('Wallet connection failed', error);
      setAccount(null);
      setBalance(null);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setBalance(null);
    // Remove event listener
    if ((window as any).ethereum) {
      (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      // Metamask is locked or the user has not connected any account
      disconnect();
    } else {
      setAccount(accounts[0]);
    }
  };

  // Check initial connection
  useEffect(() => {
    const checkConnection = async () => {
      if ((window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({ 
          method: 'eth_accounts' 
        });
        
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          
          const provider = new ethers.providers.Web3Provider((window as any).ethereum);
          const balance = await provider.getBalance(accounts[0]);
          setBalance(ethers.utils.formatEther(balance));
        }
      }
    };

    checkConnection();
  }, []);

  return {
    account,
    isConnected: !!account,
    connect,
    disconnect,
    balance
  };
};
