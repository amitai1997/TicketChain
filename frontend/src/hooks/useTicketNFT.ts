import { useState, useEffect, useCallback } from 'react';
import { useContractRead, useAccount } from 'wagmi';
import { toast } from 'sonner';
import { ethers } from 'ethers';

// Import contract ABI
import TicketNFTAbi from '../artifacts/contracts/TicketNFT.sol/TicketNFT.json';

// Debug logging
console.log('Loading useTicketNFT hook');

// Type definitions from contract
export interface TicketMetadata {
  eventId: bigint;
  price: bigint;
  validFrom: bigint;
  validUntil: bigint;
  isTransferable: boolean;
}

export interface Ticket {
  id: bigint;
  owner: string;
  metadata: TicketMetadata;
  isValid: boolean;
}

interface UseTicketNFTProps {
  contractAddress?: string;
}

export function useTicketNFT({ contractAddress }: UseTicketNFTProps = {}) {
  // Get contract address from props or env

  const [contractAddr] = useState<string>(
    contractAddress ||
      import.meta.env.VITE_CONTRACT_ADDRESS ||
      '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'
  );

  // State to track user's tickets
  const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextTokenId, setNextTokenId] = useState<bigint>(1n);

  // Get user's wallet address
  const { address: userAddress, isConnected } = useAccount();

  // Verify contract address is valid
  useEffect(() => {
    const verifyContract = async () => {
      if (typeof window === 'undefined' || !window.ethereum) return;

      console.log('Trying to find working contract address...');

      // Try connecting to the contract
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        console.log(`Testing contract at ${contractAddr}`);

        const contract = new ethers.Contract(contractAddr, TicketNFTAbi.abi, provider);

        // Try to call a view method to verify the contract exists
        await contract.name();
        console.log(`Found working contract at ${contractAddr}`);

        // Get the next token ID by checking the total supply
        try {
          const totalSupply = await contract.totalSupply();
          // Convert to number and add 1
          const nextId = totalSupply ? BigInt(totalSupply.toString()) + BigInt(1) : BigInt(1);
          setNextTokenId(nextId);
          console.log(`Next token ID is: ${nextId.toString()}`);
        } catch (error) {
          console.error('Error getting total supply:', error);
          setNextTokenId(1n);
        }
      } catch (error) {
        console.error(`Error connecting to contract at ${contractAddr}:`, error);
      }
    };

    verifyContract();
  }, [contractAddr]);

  // Setup contract read for getting total supply
  const { data: totalSupply } = useContractRead({
    address: contractAddr as `0x${string}`,
    abi: TicketNFTAbi.abi,
    functionName: 'totalSupply',
    chainId: 1337,
  });

  // Function to fetch a single ticket's data
  const fetchTicketData = useCallback(
    async (tokenId: bigint): Promise<Ticket | null> => {
      try {
        // Create an object to interact with the contract
        if (!window.ethereum) {
          throw new Error('No provider available');
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);

        const contract = new ethers.Contract(contractAddr, TicketNFTAbi.abi, provider);

        try {
          // Get owner
          const owner = await contract.ownerOf(tokenId);

          // Get metadata
          const metadata = await contract.getTicketMetadata(tokenId);

          // Check if ticket is valid
          const isValid = await contract.isTicketValid(tokenId);

          return {
            id: tokenId,
            owner,
            metadata: {
              eventId: metadata.eventId,
              price: metadata.price,
              validFrom: metadata.validFrom,
              validUntil: metadata.validUntil,
              isTransferable: metadata.isTransferable,
            },
            isValid,
          };
        } catch (error) {
          console.error(`Error fetching ticket ${tokenId} details:`, error);
          return null;
        }
      } catch (error) {
        console.error(`Error fetching ticket ${tokenId}:`, error);
        return null;
      }
    },
    [contractAddr]
  );

  // Function to fetch all of user's tickets
  const fetchUserTickets = useCallback(async () => {
    if (!isConnected || !userAddress) {
      setUserTickets([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Create an object to interact with the contract
      if (!window.ethereum) {
        throw new Error('No provider available');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);

      const contract = new ethers.Contract(contractAddr, TicketNFTAbi.abi, provider);

      try {
        // Get balance of user
        const balance = await contract.balanceOf(userAddress);

        // If user has no tickets, return empty array
        const balanceNumber = balance ? Number(balance) : 0;
        if (balanceNumber === 0) {
          setUserTickets([]);
          setIsLoading(false);
          return;
        }

        // For each token, get the token ID
        const ticketPromises = [];
        for (let i = 0; i < balanceNumber; i++) {
          try {
            const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
            ticketPromises.push(fetchTicketData(tokenId));
          } catch (error) {
            console.error(`Error fetching token at index ${i}:`, error);
          }
        }

        // Wait for all promises to resolve
        const tickets = await Promise.all(ticketPromises);

        // Filter out null tickets (in case of errors)
        setUserTickets(tickets.filter(Boolean) as Ticket[]);
      } catch (error) {
        console.error('Error fetching user tickets:', error);
        setUserTickets([]);
      }
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  }, [userAddress, isConnected, contractAddr, fetchTicketData]);

  // Function to mint a new ticket - UPDATED WITH WORKING APPROACH
  const mintNewTicket = useCallback(
    async (
      to: string,
      tokenId: bigint,
      eventId: bigint,
      price: string,
      validFrom: number,
      validUntil: number,
      isTransferable: boolean
    ) => {
      try {
        console.log(`⭐ Minting new ticket for ${to} with tokenId ${tokenId}...`);

        // Check provider availability
        if (!window.ethereum) {
          throw new Error('No provider available');
        }

        // Connect to the network
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        console.log(`Connected to network with signer: ${await signer.getAddress()}`);

        // Connect to the contract
        const contract = new ethers.Contract(contractAddr, TicketNFTAbi.abi, signer);
        console.log(`Connected to contract at ${contractAddr}`);

        // Prepare metadata - this approach works with our contract
        // Convert all numeric values to BigNumber/BigInt
        const metadata = {
          eventId: BigInt(eventId),
          price: ethers.utils.parseEther(price),
          validFrom: BigInt(validFrom),
          validUntil: BigInt(validUntil),
          isTransferable: isTransferable,
        };

        console.log(`Prepared metadata:`, {
          eventId: metadata.eventId.toString(),
          price: ethers.utils.formatEther(metadata.price) + ' ETH',
          validFrom: new Date(Number(metadata.validFrom) * 1000).toLocaleString(),
          validUntil: new Date(Number(metadata.validUntil) * 1000).toLocaleString(),
          isTransferable: metadata.isTransferable,
        });

        // Call contract with the method that worked in our test
        console.log(`Calling mintTicket with explicit gas limit...`);
        const tx = await contract.mintTicket(
          to,
          tokenId,
          metadata,
          { gasLimit: ethers.utils.hexlify(5000000) } // High gas limit
        );

        console.log(`Transaction sent: ${tx.hash}`);

        // Wait for transaction confirmation
        const receipt = await tx.wait();
        console.log(`Transaction confirmed with hash: ${receipt.transactionHash}`);

        // Verify the token was minted
        try {
          const owner = await contract.ownerOf(tokenId);
          console.log(`Token #${tokenId} minted to: ${owner}`);

          toast.success(`Ticket #${tokenId} minted successfully!`);
        } catch (error) {
          console.error(`Error verifying minted token:`, error);
        }

        return tx;
      } catch (error) {
        console.error('❌ Error minting ticket:', error);

        // Extract useful error info
        let errorMessage = 'Unknown error';
        if (error.reason) {
          errorMessage = error.reason;
        } else if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        console.error('Error details:', {
          message: errorMessage,
          code: error.code,
          data: error.data,
        });

        toast.error(`Failed to mint ticket: ${errorMessage}`);
        throw error;
      }
    },
    [contractAddr]
  );

  // Function to transfer a ticket
  const transferTicketTo = useCallback(
    async (from: string, to: string, tokenId: bigint) => {
      try {
        // Use ethers.js directly for better error handling
        if (!window.ethereum) {
          throw new Error('No provider available');
        }

        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(contractAddr, TicketNFTAbi.abi, signer);

        // Execute the transfer
        const tx = await contract.transferFrom(from, to, tokenId, {
          gasLimit: ethers.utils.hexlify(300000), // Set a higher gas limit
        });
        await tx.wait();

        toast.success('Ticket transferred successfully!');
        return tx;
      } catch (error) {
        console.error('Error transferring ticket:', error);
        toast.error('Failed to transfer ticket');
        throw error;
      }
    },
    [contractAddr]
  );

  // Load user tickets on mount or when address changes
  useEffect(() => {
    if (isConnected && userAddress) {
      fetchUserTickets();
    }
  }, [isConnected, userAddress, fetchUserTickets]);

  // Return the hook's functions and data
  return {
    userTickets,
    isLoading,
    totalSupply,
    nextTokenId,
    fetchUserTickets,
    mintNewTicket,
    transferTicketTo,
    fetchTicketData,
    contractAddress: contractAddr,
  };
}
