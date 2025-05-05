// File: src/hooks/useTicketNFT.ts
import { useState, useEffect, useCallback } from 'react'
import { useContractRead, useContractWrite, useAccount, useContractEvent } from 'wagmi'
import { parseEther } from 'viem'
import { toast } from 'sonner'
import { ethers } from 'ethers'

// Import contract ABI
import TicketNFTAbi from '../artifacts/contracts/TicketNFT.sol/TicketNFT.json'

// Debug logging
console.log("Loading useTicketNFT hook");

// Type definitions from contract
export interface TicketMetadata {
  eventId: bigint
  price: bigint
  validFrom: bigint
  validUntil: bigint
  isTransferable: boolean
}

export interface Ticket {
  id: bigint
  owner: string
  metadata: TicketMetadata
  isValid: boolean
}

interface UseTicketNFTProps {
  contractAddress?: string
}

export function useTicketNFT({ contractAddress }: UseTicketNFTProps = {}) {
  // Get contract address from props or env
  const [contractAddr, setContractAddr] = useState<string>(
    contractAddress || '0x0165878A594ca255338adfa4d48449f69242Eb8F'
  )

  // State to track user's tickets
  const [userTickets, setUserTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [nextTokenId, setNextTokenId] = useState<bigint>(1n)
  
  // Get user's wallet address
  const { address: userAddress, isConnected } = useAccount()
  
  // Verify contract address is valid
  useEffect(() => {
    const verifyContract = async () => {
      if (typeof window === 'undefined' || !window.ethereum) return;
      
      console.log("Trying to find working contract address...");
      
      // Try connecting to the contract
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        console.log(`Testing contract at ${contractAddr}`);
        
        const contract = new ethers.Contract(contractAddr, TicketNFTAbi.abi, provider);
        
        // Try to call a view method to verify the contract exists
        const name = await contract.name();
        console.log(`Found working contract at ${contractAddr}`);
        
        // Get the next token ID by checking the total supply
        try {
          const totalSupply = await contract.totalSupply();
          // Convert to number and add 1
          const nextId = totalSupply ? BigInt(totalSupply.toString()) + BigInt(1) : BigInt(1);
          setNextTokenId(nextId);
          console.log(`Next token ID is: ${nextId.toString()}`);
        } catch (error) {
          console.error("Error getting total supply:", error);
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
    chainId: 1337
  })

  // Function to fetch a single ticket's data
  const fetchTicketData = useCallback(async (tokenId: bigint): Promise<Ticket | null> => {
    try {
      // Create an object to interact with the contract
      if (!window.ethereum) {
        throw new Error('No provider available')
      }
      
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      
      const contract = new ethers.Contract(contractAddr, TicketNFTAbi.abi, provider)
      
      try {
        // Get owner
        const owner = await contract.ownerOf(tokenId)
        
        // Get metadata
        const metadata = await contract.getTicketMetadata(tokenId)
        
        // Check if ticket is valid
        const isValid = await contract.isTicketValid(tokenId)
        
        return {
          id: tokenId,
          owner,
          metadata: {
            eventId: metadata.eventId,
            price: metadata.price,
            validFrom: metadata.validFrom,
            validUntil: metadata.validUntil,
            isTransferable: metadata.isTransferable
          },
          isValid
        }
      } catch (error) {
        console.error(`Error fetching ticket ${tokenId} details:`, error)
        return null
      }
    } catch (error) {
      console.error(`Error fetching ticket ${tokenId}:`, error)
      return null
    }
  }, [contractAddr])

  // Function to fetch all of user's tickets
  const fetchUserTickets = useCallback(async () => {
    if (!isConnected || !userAddress) {
      setUserTickets([])
      setIsLoading(false)
      return
    }
    
    try {
      setIsLoading(true)
      
      // Create an object to interact with the contract
      if (!window.ethereum) {
        throw new Error('No provider available')
      }
      
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      
      const contract = new ethers.Contract(contractAddr, TicketNFTAbi.abi, provider)
      
      try {
        // Get balance of user
        const balance = await contract.balanceOf(userAddress)
        
        // If user has no tickets, return empty array
        const balanceNumber = balance ? Number(balance) : 0
        if (balanceNumber === 0) {
          setUserTickets([])
          setIsLoading(false)
          return
        }
        
        // For each token, get the token ID
        const ticketPromises = []
        for (let i = 0; i < balanceNumber; i++) {
          try {
            const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i)
            ticketPromises.push(fetchTicketData(tokenId))
          } catch (error) {
            console.error(`Error fetching token at index ${i}:`, error)
          }
        }
        
        // Wait for all promises to resolve
        const tickets = await Promise.all(ticketPromises)
        
        // Filter out null tickets (in case of errors)
        setUserTickets(tickets.filter(Boolean) as Ticket[])
      } catch (error) {
        console.error('Error fetching user tickets:', error)
        setUserTickets([])
      }
    } catch (error) {
      console.error('Error fetching user tickets:', error)
      toast.error('Failed to load tickets')
    } finally {
      setIsLoading(false)
    }
  }, [userAddress, isConnected, contractAddr, fetchTicketData])

  // Function to mint a new ticket
  const mintNewTicket = useCallback(async (
    to: string,
    tokenId: bigint,
    eventId: bigint,
    price: string,
    validFrom: number,
    validUntil: number,
    isTransferable: boolean
  ) => {
    try {
      // Check if account has MINTER_ROLE
      if (!window.ethereum) {
        throw new Error('No provider available')
      }
      
      console.log(`Using contract address: ${contractAddr}`);
      
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const signerAddress = await signer.getAddress()
      
      // Get chain ID 
      const network = await provider.getNetwork()
      console.log(`Connected to network ID: ${network.chainId}`)
      
      // Log connected account
      console.log(`Connected with account: ${signerAddress}`);
      
      // Create contract instance with signer
      const contract = new ethers.Contract(contractAddr, TicketNFTAbi.abi, signer)
      
      // Get MINTER_ROLE
      const MINTER_ROLE = await contract.MINTER_ROLE()
      console.log(`MINTER_ROLE hash: ${MINTER_ROLE}`);
      
      // Check if signer has MINTER_ROLE
      const hasMinterRole = await contract.hasRole(MINTER_ROLE, signerAddress)
      console.log(`Has MINTER_ROLE: ${hasMinterRole}`);
      
      if (!hasMinterRole) {
        console.log(`Granting MINTER_ROLE to ${signerAddress}...`)
        
        try {
          // Try to grant MINTER_ROLE to self (assuming we're admin)
          const DEFAULT_ADMIN_ROLE = await contract.DEFAULT_ADMIN_ROLE()
          const isAdmin = await contract.hasRole(DEFAULT_ADMIN_ROLE, signerAddress)
          console.log(`Has DEFAULT_ADMIN_ROLE: ${isAdmin}`);
          
          if (isAdmin) {
            // Use direct contract call for granting role
            const grantTx = await contract.grantRole(MINTER_ROLE, signerAddress, {
              gasLimit: ethers.utils.hexlify(500000)
            })
            await grantTx.wait()
            console.log(`Successfully granted MINTER_ROLE to ${signerAddress}`)
            
            // Double check role was granted
            const newHasMinterRole = await contract.hasRole(MINTER_ROLE, signerAddress)
            console.log(`Now has MINTER_ROLE: ${newHasMinterRole}`);
            
            if (!newHasMinterRole) {
              throw new Error("Failed to grant MINTER_ROLE despite transaction success")
            }
          } else {
            throw new Error(`Account ${signerAddress} is not an admin and cannot mint tickets`)
          }
        } catch (error) {
          console.error('Error granting MINTER_ROLE:', error)
          toast.error('Unable to grant minter permissions')
          throw new Error('Permission denied: Not a minter and unable to grant role')
        }
      }
      
      // Convert price to Wei
      const priceInWei = parseEther(price)
      
      // Get the actual next token ID (from totalSupply)
      try {
        const totalSupply = await contract.totalSupply();
        const actualNextTokenId = BigInt(totalSupply.toString()) + BigInt(1);
        console.log(`Using tokenId: ${actualNextTokenId.toString()} instead of provided ${tokenId.toString()}`);
        tokenId = actualNextTokenId;
      } catch (error) {
        console.log("Couldn't get total supply, using provided tokenId:", tokenId.toString());
      }
      
      // Prepare metadata
      const metadata = {
        eventId,
        price: priceInWei,
        validFrom: BigInt(validFrom),
        validUntil: BigInt(validUntil),
        isTransferable
      }
      
      console.log('Minting with params:', {
        to,
        tokenId: tokenId.toString(),
        metadata: {
          eventId: metadata.eventId.toString(),
          price: metadata.price.toString(),
          validFrom: metadata.validFrom.toString(),
          validUntil: metadata.validUntil.toString(),
          isTransferable: metadata.isTransferable
        }
      })
      
      // Check if timestamps are correct
      if (metadata.validFrom >= metadata.validUntil) {
        console.error("Invalid time range: validFrom must be before validUntil");
        toast.error("Invalid time range: Start time must be before end time");
        throw new Error("Invalid time range");
      }
      
      // Call mintTicket directly with signer and explicit gas parameters
      const tx = await contract.mintTicket(
        to, 
        tokenId, 
        [
          metadata.eventId,
          metadata.price,
          metadata.validFrom,
          metadata.validUntil,
          metadata.isTransferable
        ],
        {
          gasLimit: ethers.utils.hexlify(1000000)  // Set a higher gas limit
        }
      );
      
      console.log('Transaction submitted:', tx.hash);
      
      const receipt = await tx.wait()
      
      console.log('Mint transaction successful:', receipt);
      
      toast.success('Ticket minted successfully!')
      return tx
    } catch (error) {
      console.error('Error minting ticket:', error)
      
      // Try to extract the revert reason if available
      let revertReason = "Unknown error";
      
      if (error.data) {
        try {
          // Get error data for revert reason
          const errorData = error.data;
          if (errorData.message) revertReason = errorData.message;
        } catch (e) {
          console.error("Error extracting revert reason:", e);
        }
      } else if (error.reason) {
        revertReason = error.reason;
      } else if (error.error && error.error.message) {
        revertReason = error.error.message;
      } else if (error.message) {
        revertReason = error.message;
      }
      
      // Extract more specific error information if available
      const errorMessage = error.message || 'Unknown error';
      const reason = error.reason || (error.error && error.error.reason);
      
      console.error('Error details:', {
        message: errorMessage,
        reason: reason,
        data: error.data,
        transaction: error.transaction,
        revertReason: revertReason
      });
      
      toast.error(`Failed to mint ticket: ${revertReason}`)
      throw error
    }
  }, [contractAddr])

  // Function to transfer a ticket
  const transferTicketTo = useCallback(async (
    from: string,
    to: string,
    tokenId: bigint
  ) => {
    try {
      // Use ethers.js directly for better error handling
      if (!window.ethereum) {
        throw new Error('No provider available')
      }
      
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddr, TicketNFTAbi.abi, signer)
      
      // Execute the transfer
      const tx = await contract.transferFrom(from, to, tokenId, {
        gasLimit: ethers.utils.hexlify(300000) // Set a higher gas limit
      })
      await tx.wait()
      
      toast.success('Ticket transferred successfully!')
      return tx
    } catch (error) {
      console.error('Error transferring ticket:', error)
      toast.error('Failed to transfer ticket')
      throw error
    }
  }, [contractAddr])

  // Load user tickets on mount or when address changes
  useEffect(() => {
    if (isConnected && userAddress) {
      fetchUserTickets()
    }
  }, [isConnected, userAddress, fetchUserTickets])

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
    contractAddress: contractAddr
  }
}
