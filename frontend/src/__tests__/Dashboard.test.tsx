// File: src/__tests__/Dashboard.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import { useTicketNFT } from '../hooks/useTicketNFT'

// Mock the useTicketNFT hook
vi.mock('../hooks/useTicketNFT', () => ({
  useTicketNFT: vi.fn(),
}))

// Mock the useAccount hook from wagmi
vi.mock('wagmi', () => ({
  useAccount: () => ({
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true,
  }),
}))

describe('Dashboard Component', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks()
  })

  it('renders loading state correctly', () => {
    // Mock the hook to return loading state
    vi.mocked(useTicketNFT).mockReturnValue({
      userTickets: [],
      isLoading: true,
      fetchUserTickets: vi.fn(),
      transferTicketTo: vi.fn(),
    })

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    // Check if loading state is displayed
    expect(screen.getByText('Loading your tickets...')).toBeInTheDocument()
  })

  it('renders empty state when no tickets', async () => {
    // Mock the hook to return empty tickets
    vi.mocked(useTicketNFT).mockReturnValue({
      userTickets: [],
      isLoading: false,
      fetchUserTickets: vi.fn(),
      transferTicketTo: vi.fn(),
    })

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    // Check if empty state is displayed
    expect(screen.getByText('No tickets found')).toBeInTheDocument()
    expect(screen.getByText('You don\'t have any NFT tickets yet')).toBeInTheDocument()
    expect(screen.getByText('Mint Your First Ticket')).toBeInTheDocument()
  })

  it('renders tickets when available', async () => {
    // Create mock tickets
    const mockTickets = [
      {
        id: BigInt(1),
        owner: '0x1234567890123456789012345678901234567890',
        metadata: {
          eventId: BigInt(101),
          price: BigInt(10000000000000000), // 0.01 ETH
          validFrom: BigInt(Math.floor(Date.now() / 1000) - 86400), // 1 day ago
          validUntil: BigInt(Math.floor(Date.now() / 1000) + 86400), // 1 day from now
          isTransferable: true,
        },
        isValid: true,
      },
      {
        id: BigInt(2),
        owner: '0x1234567890123456789012345678901234567890',
        metadata: {
          eventId: BigInt(102),
          price: BigInt(20000000000000000), // 0.02 ETH
          validFrom: BigInt(Math.floor(Date.now() / 1000) - 86400), // 1 day ago
          validUntil: BigInt(Math.floor(Date.now() / 1000) - 3600), // 1 hour ago (expired)
          isTransferable: true,
        },
        isValid: false,
      },
    ]

    // Mock the hook to return tickets
    vi.mocked(useTicketNFT).mockReturnValue({
      userTickets: mockTickets,
      isLoading: false,
      fetchUserTickets: vi.fn(),
      transferTicketTo: vi.fn(),
    })

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    // Check if tickets are displayed
    expect(screen.getByText('Ticket #1')).toBeInTheDocument()
    expect(screen.getByText('Ticket #2')).toBeInTheDocument()
    
    // Check if valid/expired badges are displayed
    expect(screen.getByText('Valid')).toBeInTheDocument()
    expect(screen.getByText('Expired')).toBeInTheDocument()
    
    // Check if stats are displayed correctly
    expect(screen.getByText('2')).toBeInTheDocument() // Total tickets
    expect(screen.getByText('1')).toBeInTheDocument() // Valid and expired tickets
  })

  it('opens transfer modal when clicking transfer button', async () => {
    // Create mock ticket
    const mockTickets = [
      {
        id: BigInt(1),
        owner: '0x1234567890123456789012345678901234567890',
        metadata: {
          eventId: BigInt(101),
          price: BigInt(10000000000000000), // 0.01 ETH
          validFrom: BigInt(Math.floor(Date.now() / 1000) - 86400), // 1 day ago
          validUntil: BigInt(Math.floor(Date.now() / 1000) + 86400), // 1 day from now
          isTransferable: true,
        },
        isValid: true,
      },
    ]

    // Mock the hook to return tickets
    const transferTicketToMock = vi.fn().mockResolvedValue({})
    vi.mocked(useTicketNFT).mockReturnValue({
      userTickets: mockTickets,
      isLoading: false,
      fetchUserTickets: vi.fn(),
      transferTicketTo: transferTicketToMock,
    })

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    )

    // Click the transfer button
    fireEvent.click(screen.getByText('Transfer'))
    
    // Check if modal is opened
    expect(screen.getByText('Transfer Ticket #1')).toBeInTheDocument()
    expect(screen.getByLabelText('Recipient wallet address')).toBeInTheDocument()
    
    // Fill in recipient address and submit
    fireEvent.change(screen.getByLabelText('Recipient wallet address'), {
      target: { value: '0x0987654321098765432109876543210987654321' },
    })
    
    fireEvent.click(screen.getByText('Transfer'))
    
    // Check if transferTicketTo was called with correct arguments
    await waitFor(() => {
      expect(transferTicketToMock).toHaveBeenCalledWith(
        '0x1234567890123456789012345678901234567890', // from
        '0x0987654321098765432109876543210987654321', // to
        BigInt(1) // tokenId
      )
    })
  })
})
