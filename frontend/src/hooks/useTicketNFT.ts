// File: src/hooks/useTicketNFT.ts
import { useState, useEffect, useCallback } from 'react'
import { useContractRead, useContractWrite, useAccount, useContractEvent } from 'wagmi'
import { parseEther } from 'viem'
import { toast } from 'sonner'
import { ethers } from 'ethers'

// Import contract ABI
// Using require since import can have issues with JSON files in TypeScript
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
    chainId: 1337, // Use 1337 (0x539) instead of 31337 (0x7a69)
    watch: true,
  })

  // Setup contract write for minting new tickets
  const { writeAsync: mintTicket } = useContractWrite({
    address: contractAddr as `0x${string}`,
    abi: TicketNFTAbi.abi,
    functionName: 'mintTicket',
    chainId: 1337, // Use 1337 (0x539) instead of 31337 (0x7a69)
  })

  // Setup contract write for transferring tickets
  const { writeAsync: transferTicket } = useContractWrite({
    address: contractAddr as `0x${string}`,
    abi: TicketNFTAbi.abi,
    functionName: 'transferFrom',
    chainId: 1337, // Use 1337 (0x539) instead of 31337 (0x7a69)
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
    chainId: 1337, // Use 1337 (0x539) instead of 31337 (0x7a69)
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
      
      // Get balance of user
      const balance = await contract.balanceOf(userAddress)
      
      // If user has no tickets, return empty array
      if (balance === 0n || balance.eq(0)) {
        setUserTickets([])
        setIsLoading(false)
        return
      }
      
      // For each token, get the token ID
      const ticketPromises = []
      for (let i = 0; i < Number(balance); i++) {
        const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i)
        ticketPromises.push(fetchTicketData(tokenId))
      }
      
      // Wait for all promises to resolve
      const tickets = await Promise.all(ticketPromises)
      
      // Filter out null tickets (in case of errors)
      setUserTickets(tickets.filter(Boolean) as Ticket[])
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
      const priceInWei = parseEther(price)
      
      const metadata = {
        eventId,
        price: priceInWei,
        validFrom: BigInt(validFrom),
        validUntil: BigInt(validUntil),
        isTransferable
      }
      
      const tx = await mintTicket({
        args: [to, tokenId, metadata],
      })
      
      toast.success('Ticket minting in progress')
      
      return tx
    } catch (error) {
      console.error('Error minting ticket:', error)
      toast.error('Failed to mint ticket')
      throw error
    }
  }, [mintTicket])

  // Function to transfer a ticket
  const transferTicketTo = useCallback(async (
    from: string,
    to: string,
    tokenId: bigint
  ) => {
    try {
      const tx = await transferTicket({
        args: [from, to, tokenId],
      })
      
      toast.success('Ticket transfer in progress')
      
      return tx
    } catch (error) {
      console.error('Error transferring ticket:', error)
      toast.error('Failed to transfer ticket')
      throw error
    }
  }, [transferTicket])

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
    fetchTicketData
  }
}
