import React from 'react';
import styled from 'styled-components';
import { useWalletConnection } from '../hooks/useWalletConnection';

const WalletContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: #f4f4f4;
  border-radius: 8px;
`;

const ConnectButton = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #0056b3;
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const AccountInfo = styled.div`
  margin-left: 15px;
  font-size: 14px;
`;

const DisconnectButton = styled.button`
  background-color: #dc3545;
  color: white;
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  margin-left: 10px;
  cursor: pointer;
`;

export const WalletConnection: React.FC = () => {
  const { 
    account, 
    isConnected, 
    connect, 
    disconnect, 
    balance 
  } = useWalletConnection();

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <WalletContainer>
      {!isConnected ? (
        <ConnectButton onClick={connect}>
          Connect Wallet
        </ConnectButton>
      ) : (
        <>
          <AccountInfo>
            Account: {formatAddress(account || '')}
            {balance && ` | Balance: ${parseFloat(balance).toFixed(4)} MATIC`}
          </AccountInfo>
          <DisconnectButton onClick={disconnect}>
            Disconnect
          </DisconnectButton>
        </>
      )}
    </WalletContainer>
  );
};
