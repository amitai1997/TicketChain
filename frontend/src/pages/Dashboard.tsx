// File: src/pages/Dashboard.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Calendar, 
  Clock, 
  Tag, 
  ArrowRight, 
  Ticket as TicketIcon, 
  Send,
  RefreshCw
} from 'lucide-react'
import { useAccount } from 'wagmi'
import { useTicketNFT, Ticket } from '@/hooks/useTicketNFT'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { toast } from 'sonner'

// Format date from timestamp
const formatDate = (timestamp: bigint) => {
  return new Date(Number(timestamp) * 1000).toLocaleString()
}

// Format price from Wei
const formatPrice = (priceInWei: bigint) => {
  // Convert Wei to Ether
  const priceInEther = Number(priceInWei) / 1e18
  return `${priceInEther.toFixed(4)} ETH`
}

// Transfer ticket modal component
const TransferTicketModal = ({ 
  ticket, 
  isOpen, 
  onClose, 
  onTransfer 
}: { 
  ticket: Ticket | null, 
  isOpen: boolean, 
  onClose: () => void, 
  onTransfer: (to: string) => Promise<void> 
}) => {
  const [recipientAddress, setRecipientAddress] = useState('')
  const [isTransferring, setIsTransferring] = useState(false)
  
  if (!isOpen || !ticket) return null
  
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!recipientAddress.trim()) {
      toast.error('Please enter a recipient address')
      return
    }
    
    setIsTransferring(true)
    
    try {
      await onTransfer(recipientAddress)
      onClose()
    } catch (error) {
      console.error('Transfer error:', error)
    } finally {
      setIsTransferring(false)
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background p-6 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Transfer Ticket #{ticket.id.toString()}</h2>
        
        <form onSubmit={handleTransfer}>
          <div className="mb-4">
            <label htmlFor="recipient" className="block text-sm font-medium text-muted-foreground mb-1">
              Recipient Address
            </label>
            <input
              id="recipient"
              type="text"
              className="w-full p-2 border border-border rounded-md bg-background"
              placeholder="0x..."
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              required
              aria-label="Recipient wallet address"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              className="px-4 py-2 border border-border rounded-md hover:bg-muted"
              onClick={onClose}
              disabled={isTransferring}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center"
              disabled={isTransferring}
            >
              {isTransferring ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Transferring...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Transfer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Ticket card component
const TicketCard = ({ 
  ticket, 
  onTransfer 
}: { 
  ticket: Ticket, 
  onTransfer: (ticket: Ticket) => void 
}) => {
  const now = Math.floor(Date.now() / 1000)
  const isExpired = Number(ticket.metadata.validUntil) < now
  
  return (
    <div className="ticket-container">
      <div className="ticket-header">
        <h3 className="ticket-title">Ticket #{ticket.id.toString()}</h3>
        <span className={`ticket-badge ${isExpired ? 'ticket-badge-expired' : 'ticket-badge-valid'}`}>
          {isExpired ? 'Expired' : 'Valid'}
        </span>
      </div>
      
      <div className="ticket-info">
        <div className="ticket-detail">
          <span className="ticket-detail-label flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            Event ID
          </span>
          <span className="ticket-detail-value">#{ticket.metadata.eventId.toString()}</span>
        </div>
        
        <div className="ticket-detail">
          <span className="ticket-detail-label flex items-center">
            <Tag className="h-4 w-4 mr-1" />
            Price
          </span>
          <span className="ticket-detail-value">{formatPrice(ticket.metadata.price)}</span>
        </div>
        
        <div className="ticket-detail">
          <span className="ticket-detail-label flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Valid From
          </span>
          <span className="ticket-detail-value">{formatDate(ticket.metadata.validFrom)}</span>
        </div>
        
        <div className="ticket-detail">
          <span className="ticket-detail-label flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Valid Until
          </span>
          <span className="ticket-detail-value">{formatDate(ticket.metadata.validUntil)}</span>
        </div>
      </div>
      
      <div className="ticket-actions">
        <button
          className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center justify-center"
          onClick={() => onTransfer(ticket)}
          disabled={!ticket.metadata.isTransferable || isExpired}
          aria-label={`Transfer ticket #${ticket.id.toString()}`}
        >
          <Send className="h-4 w-4 mr-2" />
          Transfer
        </button>
      </div>
    </div>
  )
}

// Dashboard page component
const Dashboard = () => {
  const navigate = useNavigate()
  const { isConnected } = useAccount()
  const { userTickets, isLoading, fetchUserTickets, transferTicketTo } = useTicketNFT()
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  
  // Handle transfer ticket button click
  const handleTransferClick = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setIsTransferModalOpen(true)
  }
  
  // Handle ticket transfer
  const handleTransferTicket = async (to: string) => {
    if (!selectedTicket) return
    
    try {
      await transferTicketTo(
        selectedTicket.owner,
        to,
        selectedTicket.id
      )
      
      // Close modal and refresh tickets after a short delay
      setTimeout(() => {
        fetchUserTickets()
      }, 2000)
    } catch (error) {
      console.error('Transfer failed:', error)
      toast.error('Failed to transfer ticket')
    }
  }
  
  // Calculate dashboard stats
  const totalTickets = userTickets.length
  const validTickets = userTickets.filter(ticket => 
    Number(ticket.metadata.validUntil) > Math.floor(Date.now() / 1000)
  ).length
  
  // If not connected, show connect wallet message
  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="py-12 px-4">
          <TicketIcon className="h-16 w-16 mx-auto mb-6 text-primary" />
          <h1 className="text-3xl font-bold mb-4">Welcome to TicketChain</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Connect your wallet to manage your NFT tickets
          </p>
          <div className="inline-block">
            <ConnectButton />
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">Your Tickets</h1>
          <p className="text-muted-foreground">Manage your NFT tickets</p>
        </div>
        <button
          onClick={() => navigate('/mint')}
          className="mt-4 sm:mt-0 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center"
        >
          <TicketIcon className="h-4 w-4 mr-2" />
          Mint New Ticket
        </button>
      </div>
      
      {/* Dashboard stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-6 bg-background border border-border rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Total Tickets</h3>
          <p className="text-3xl font-bold">{totalTickets}</p>
        </div>
        <div className="p-6 bg-background border border-border rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Valid Tickets</h3>
          <p className="text-3xl font-bold">{validTickets}</p>
        </div>
        <div className="p-6 bg-background border border-border rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Expired Tickets</h3>
          <p className="text-3xl font-bold">{totalTickets - validTickets}</p>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin" />
          <p className="text-muted-foreground">Loading your tickets...</p>
        </div>
      ) : userTickets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {userTickets.map((ticket) => (
            <TicketCard 
              key={ticket.id.toString()} 
              ticket={ticket} 
              onTransfer={handleTransferClick} 
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <TicketIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-medium mb-2">No tickets found</h2>
          <p className="text-muted-foreground mb-6">
            You don't have any NFT tickets yet
          </p>
          <button
            onClick={() => navigate('/mint')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center mx-auto"
          >
            <TicketIcon className="h-4 w-4 mr-2" />
            Mint Your First Ticket
          </button>
        </div>
      )}
      
      {/* Transfer ticket modal */}
      <TransferTicketModal
        ticket={selectedTicket}
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onTransfer={handleTransferTicket}
      />
    </div>
  )
}

export default Dashboard
