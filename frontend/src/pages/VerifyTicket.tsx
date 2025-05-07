// File: src/pages/VerifyTicket.tsx
import { useState } from 'react'
import { Search, Ticket as TicketIcon, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { useTicketNFT } from '@/hooks/useTicketNFT'
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

const VerifyTicket = () => {
  const [ticketId, setTicketId] = useState('')
  const [verifiedTicket, setVerifiedTicket] = useState<any | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const { fetchTicketData } = useTicketNFT()

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!ticketId.trim()) {
      toast.error('Please enter a ticket ID')
      return
    }

    try {
      setIsVerifying(true)
      setVerifiedTicket(null)
      setIsVerified(null)

      const ticket = await fetchTicketData(BigInt(ticketId))

      if (ticket) {
        setVerifiedTicket(ticket)

        // Check if ticket is valid (not expired)
        const now = Math.floor(Date.now() / 1000)
        const isValid =
          Number(ticket.metadata.validFrom) <= now &&
          Number(ticket.metadata.validUntil) > now

        setIsVerified(isValid)
      } else {
        toast.error('Ticket not found')
        setIsVerified(false)
      }
    } catch (error) {
      console.error('Error verifying ticket:', error)
      toast.error('Failed to verify ticket')
      setIsVerified(false)
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <TicketIcon className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h1 className="text-3xl font-bold">Verify Ticket</h1>
        <p className="text-muted-foreground">Check if a ticket is valid and authentic</p>
      </div>

      <div className="bg-card p-6 rounded-lg border border-border shadow-sm mb-8">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="ticketId" className="sr-only">Ticket ID</label>
            <input
              id="ticketId"
              type="number"
              min="1"
              className="w-full p-3 border border-border rounded-md bg-background"
              placeholder="Enter ticket ID"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              required
              aria-label="Ticket ID to verify"
            />
          </div>
          <button
            type="submit"
            className="py-3 px-6 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center justify-center whitespace-nowrap"
            disabled={isVerifying}
          >
            {isVerifying ? (
              <>
                <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Search className="h-5 w-5 mr-2" />
                Verify Ticket
              </>
            )}
          </button>
        </form>
      </div>

      {/* Verification Result */}
      {isVerified !== null && (
        <div className="bg-card p-6 rounded-lg border border-border shadow-sm">
          <div className="flex items-center mb-6">
            {isVerified ? (
              <>
                <CheckCircle className="h-8 w-8 text-ticket-secondary mr-3" />
                <h2 className="text-2xl font-bold">Ticket is Valid</h2>
              </>
            ) : (
              <>
                <XCircle className="h-8 w-8 text-destructive mr-3" />
                <h2 className="text-2xl font-bold">Ticket is Invalid</h2>
              </>
            )}
          </div>

          {verifiedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-muted/30 rounded-md">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Ticket ID</h3>
                  <p className="text-lg font-medium">#{verifiedTicket.id.toString()}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-md">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Event ID</h3>
                  <p className="text-lg font-medium">#{verifiedTicket.metadata.eventId.toString()}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-md">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Owner</h3>
                  <p className="text-sm font-medium truncate">{verifiedTicket.owner}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-md">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Price</h3>
                  <p className="text-lg font-medium">{formatPrice(verifiedTicket.metadata.price)}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-md">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Valid From</h3>
                  <p className="text-sm font-medium">{formatDate(verifiedTicket.metadata.validFrom)}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-md">
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Valid Until</h3>
                  <p className="text-sm font-medium">{formatDate(verifiedTicket.metadata.validUntil)}</p>
                </div>
              </div>

              {!isVerified && (
                <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-md flex items-start">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5 mr-3" />
                  <div>
                    <h4 className="font-medium text-destructive">Verification Failed</h4>
                    <p className="text-sm text-muted-foreground">
                      This ticket is not currently valid. It may be expired, not yet active, or has been revoked.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default VerifyTicket
