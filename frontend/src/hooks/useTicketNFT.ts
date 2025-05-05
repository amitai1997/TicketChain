// File: src/hooks/useTicketNFT.ts
import { useState, useEffect, useCallback } from 'react'
import { useContractRead, useContractWrite, useAccount, useContractEvent } from 'wagmi'
import { parseEther } from 'viem'
import { toast } from 'sonner'
import { ethers } from 'ethers'

// Import contract ABI
import TicketNFTAbi from '../artifacts/contracts/TicketNFT.sol/TicketNFT.json'

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
  const contractAddr = contractAddress || '0x5FbDB2315678afecb367f032d93F642f64180aa3'

  // State to track user's tickets
  const [userTickets, setUserTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Get user's wallet address
  const { address: userAddress, isConnected } = useAccount()

  // Setup contract read for getting total supply
  const { data: totalSupply } = useContractRead({
    address: contractAddr as `0x${string}`,
    abi: TicketNFTAbi.abi,
    functionName: 'totalSupply',
    chainId: 1337
  })

  // Setup contract write for minting new tickets
  const { writeAsync: mintTicket } = useContractWrite({
    address: contractAddr as `0x${string}`,
    abi: TicketNFTAbi.abi,
    functionName: 'mintTicket',
    chainId: 1337
  })

  // Setup contract write for transferring tickets
  const { writeAsync: transferTicket } = useContractWrite({
    address: contractAddr as `0x${string}`,
    abi: TicketNFTAbi.abi,
    functionName: 'transferFrom',
    chainId: 1337
  })

  // Listen for Transfer events
  useContractEvent({
    address: contractAddr as `0x${string}`,
    abi: TicketNFTAbi.abi,
    eventName: 'Transfer',
    listener(logs) {
      // Refresh user tickets when an event involves the user
      const isUserInvolved = logs.some(log => {
        // Safely extract from and to address from the event logs
        // @ts-ignore - Type issues with args extraction
        const { from, to } = (log.args || {}) as { from?: string, to?: string }
        return from === userAddress || to === userAddress
      })

      if (isUserInvolved) {
        fetchUserTickets()
      }
    },
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

  // Function to check if an account has a role
  const checkHasRole = useCallback(async (role: string, account: string) => {
    try {
      if (!window.ethereum) {
        throw new Error('No provider available')
      }
      
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const contract = new ethers.Contract(contractAddr, TicketNFTAbi.abi, provider)
      
      // Check if account has role
      return await contract.hasRole(role, account)
    } catch (error) {
      console.error(`Error checking role ${role} for ${account}:`, error)
      return false
    }
  }, [contractAddr])

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
      
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const signerAddress = await signer.getAddress()
      
      const contract = new ethers.Contract(contractAddr, TicketNFTAbi.abi, signer)
      
      // Get MINTER_ROLE
      const MINTER_ROLE = await contract.MINTER_ROLE()
      
      // Check if signer has MINTER_ROLE
      const hasMinterRole = await contract.hasRole(MINTER_ROLE, signerAddress)
      
      if (!hasMinterRole) {
        console.log(`Granting MINTER_ROLE to ${signerAddress}...`)
        
        try {
          // Try to grant MINTER_ROLE to self (assuming we're admin)
          const DEFAULT_ADMIN_ROLE = await contract.DEFAULT_ADMIN_ROLE()
          const isAdmin = await contract.hasRole(DEFAULT_ADMIN_ROLE, signerAddress)
          
          if (isAdmin) {
            const grantTx = await contract.grantRole(MINTER_ROLE, signerAddress)
            await grantTx.wait()
            console.log(`Successfully granted MINTER_ROLE to ${signerAddress}`)
          } else {
            throw new Error(`Account ${signerAddress} is not an admin and cannot mint tickets`)
          }
        } catch (error) {
          console.error('Error granting MINTER_ROLE:', error)
          toast.error('You don\'t have permission to mint tickets')
          throw new Error('Permission denied: Not a minter')
        }
      }
      
      // Convert price to Wei
      const priceInWei = parseEther(price)
      
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
        metadata
      })
      
      // Call mintTicket directly with signer
      const tx = await contract.mintTicket(to, tokenId, metadata)
      await tx.wait()
      
      toast.success('Ticket minted successfully!')
      return tx
    } catch (error) {
      console.error('Error minting ticket:', error)
      toast.error('Failed to mint ticket')
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
      const tx = await contract.transferFrom(from, to, tokenId)
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
    fetchUserTickets,
    mintNewTicket,
    transferTicketTo,
    fetchTicketData,
    checkHasRole
  }
}
