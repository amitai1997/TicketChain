// File: src/pages/MintTicket.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ticket, Clock, Tag, Calendar, RefreshCw } from 'lucide-react'
import { useAccount } from 'wagmi'
import { useTicketNFT } from '@/hooks/useTicketNFT'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { toast } from 'sonner'

const MintTicket = () => {
  const navigate = useNavigate()
  const { isConnected, address } = useAccount()
  const { mintNewTicket, totalSupply } = useTicketNFT()
  const [isMinting, setIsMinting] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    eventId: '1',
    price: '0.01',
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days later
    isTransferable: true,
  })

  // Handle form change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : type === 'date' 
          ? new Date(value) 
          : value
    }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first')
      return
    }
    
    try {
      setIsMinting(true)
      
      // Calculate token ID based on total supply
      const newTokenId = totalSupply ? totalSupply + 1n : 1n
      
      // Convert dates to Unix timestamps
      const validFrom = Math.floor(formData.validFrom.getTime() / 1000)
      const validUntil = Math.floor(formData.validUntil.getTime() / 1000)
      
      await mintNewTicket(
        address,
        newTokenId,
        BigInt(formData.eventId),
        formData.price,
        validFrom,
        validUntil,
        formData.isTransferable
      )
      
      toast.success('Ticket successfully minted!')
      
      // Redirect to dashboard after successful minting
      setTimeout(() => {
        navigate('/')
      }, 2000)
    } catch (error) {
      console.error('Error minting ticket:', error)
      toast.error('Failed to mint ticket')
    } finally {
      setIsMinting(false)
    }
  }

  // If not connected, show connect wallet message
  if (!isConnected) {
    return (
      <div className="max-w-4xl mx-auto text-center">
        <div className="py-12 px-4">
          <Ticket className="h-16 w-16 mx-auto mb-6 text-primary" />
          <h1 className="text-3xl font-bold mb-4">Mint a New Ticket</h1>
          <p className="text-muted-foreground text-lg mb-8">
            Connect your wallet to mint NFT tickets
          </p>
          <div className="inline-block">
            <ConnectButton />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Mint a New Ticket</h1>
        <p className="text-muted-foreground">Create a new NFT ticket for your event</p>
      </div>
      
      <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Event ID */}
            <div>
              <label htmlFor="eventId" className="block text-sm font-medium mb-1 flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Event ID
              </label>
              <input
                id="eventId"
                name="eventId"
                type="number"
                min="1"
                className="w-full p-2 border border-border rounded-md bg-background"
                value={formData.eventId}
                onChange={handleChange}
                required
                aria-label="Event ID"
              />
            </div>
            
            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium mb-1 flex items-center">
                <Tag className="h-4 w-4 mr-1" />
                Price (ETH)
              </label>
              <input
                id="price"
                name="price"
                type="number"
                step="0.0001"
                min="0"
                className="w-full p-2 border border-border rounded-md bg-background"
                value={formData.price}
                onChange={handleChange}
                required
                aria-label="Ticket price in ETH"
              />
            </div>
            
            {/* Valid From */}
            <div>
              <label htmlFor="validFrom" className="block text-sm font-medium mb-1 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Valid From
              </label>
              <input
                id="validFrom"
                name="validFrom"
                type="datetime-local"
                className="w-full p-2 border border-border rounded-md bg-background"
                value={formData.validFrom.toISOString().slice(0, 16)}
                onChange={handleChange}
                required
                aria-label="Ticket valid from date"
              />
            </div>
            
            {/* Valid Until */}
            <div>
              <label htmlFor="validUntil" className="block text-sm font-medium mb-1 flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Valid Until
              </label>
              <input
                id="validUntil"
                name="validUntil"
                type="datetime-local"
                className="w-full p-2 border border-border rounded-md bg-background"
                value={formData.validUntil.toISOString().slice(0, 16)}
                onChange={handleChange}
                required
                aria-label="Ticket valid until date"
              />
            </div>
            
            {/* Is Transferable */}
            <div className="flex items-center">
              <input
                id="isTransferable"
                name="isTransferable"
                type="checkbox"
                className="h-4 w-4 rounded border-border"
                checked={formData.isTransferable}
                onChange={handleChange}
                aria-label="Allow ticket transfer"
              />
              <label htmlFor="isTransferable" className="ml-2 block text-sm">
                Allow ticket transfer
              </label>
            </div>
            
            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center justify-center"
                disabled={isMinting}
              >
                {isMinting ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Minting...
                  </>
                ) : (
                  <>
                    <Ticket className="h-5 w-5 mr-2" />
                    Mint Ticket
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MintTicket
