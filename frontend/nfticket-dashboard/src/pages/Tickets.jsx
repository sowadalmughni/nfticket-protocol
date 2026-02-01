/**
 * Tickets Page
 * View and manage NFT tickets with Subgraph integration
 * @author Sowad Al-Mughni
 */
import { useState, useEffect, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { useQuery } from '@apollo/client'
import { formatEther } from 'viem'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { createGraphClient, GET_MY_TICKETS, GET_ALL_TICKETS } from '@/lib/graphql'

// Mock Data fallback when subgraph is not available
const mockTickets = [
  {
    id: "1",
    tokenId: "101",
    eventName: "Web3 Conference 2024",
    originalPrice: "500000000000000000", // 0.5 ETH in wei
    isUsed: false,
    owner: { id: "0x123...abc" },
    uri: "https://api.nfticket.example.com/metadata/101"
  },
  {
    id: "2",
    tokenId: "102",
    eventName: "NFT Art Exhibition",
    originalPrice: "200000000000000000", // 0.2 ETH
    isUsed: true,
    owner: { id: "0x456...def" },
    uri: "https://api.nfticket.example.com/metadata/102"
  },
  {
    id: "3",
    tokenId: "105",
    eventName: "DeFi Summit London",
    originalPrice: "800000000000000000", // 0.8 ETH
    isUsed: false,
    owner: { id: "0x789...ghi" },
    uri: "https://api.nfticket.example.com/metadata/105"
  }
]

// Ticket Card Component
function TicketCard({ ticket, onRevealQR }) {
  const price = ticket.originalPrice ? 
    `${parseFloat(formatEther(BigInt(ticket.originalPrice))).toFixed(3)} ETH` : 
    'N/A'

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Token #{ticket.tokenId}
        </CardTitle>
        {ticket.isUsed ? (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">Used</Badge>
        ) : (
          <Badge className="bg-green-100 text-green-800">Active</Badge>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="text-lg font-bold mb-1 line-clamp-2">
          {ticket.eventName || `Ticket #${ticket.tokenId}`}
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          Price: {price}
        </p>
        <p className="text-xs text-muted-foreground mb-4 font-mono truncate">
          Owner: {ticket.owner?.id || 'Unknown'}
        </p>
        <div className="mt-auto pt-4 border-t">
          <Button 
            className="w-full" 
            disabled={ticket.isUsed} 
            variant={ticket.isUsed ? "outline" : "default"}
            onClick={() => onRevealQR(ticket)}
          >
            {ticket.isUsed ? "🎫 Ticket Redeemed" : "📱 Reveal QR Code"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Loading Skeleton
function TicketSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-16" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  )
}

export function Tickets() {
  const { isConnected, address, chain } = useAccount()
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [useSubgraph, setUseSubgraph] = useState(false)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Create graph client based on chain
  const graphClient = useMemo(() => {
    if (chain?.id) {
      return createGraphClient(chain.id)
    }
    return null
  }, [chain?.id])

  // Fetch tickets from subgraph or use mock data
  useEffect(() => {
    async function fetchTickets() {
      if (!isConnected || !address) {
        setTickets([])
        return
      }

      setLoading(true)
      setError(null)

      try {
        if (graphClient && useSubgraph) {
          const { data } = await graphClient.query({
            query: GET_MY_TICKETS,
            variables: { owner: address.toLowerCase() }
          })
          
          if (data?.tickets) {
            setTickets(data.tickets)
          } else {
            setTickets(mockTickets)
          }
        } else {
          // Use mock data
          setTickets(mockTickets)
        }
      } catch (err) {
        console.warn('Subgraph query failed, using mock data:', err.message)
        setError('Subgraph unavailable - showing demo data')
        setTickets(mockTickets)
      } finally {
        setLoading(false)
      }
    }

    fetchTickets()
  }, [isConnected, address, graphClient, useSubgraph])

  // Filter tickets
  const filteredTickets = useMemo(() => {
    let result = tickets

    // Apply status filter
    if (filter === 'active') {
      result = result.filter(t => !t.isUsed)
    } else if (filter === 'used') {
      result = result.filter(t => t.isUsed)
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(t => 
        t.tokenId.toString().includes(query) ||
        (t.eventName && t.eventName.toLowerCase().includes(query)) ||
        (t.owner?.id && t.owner.id.toLowerCase().includes(query))
      )
    }

    return result
  }, [tickets, filter, searchQuery])

  const handleRevealQR = (ticket) => {
    // TODO: Implement QR code modal
    alert(`QR Code for Ticket #${ticket.tokenId}\nOwner: ${ticket.owner?.id}`)
  }

  if (!isConnected) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
          <p className="mt-2 text-sm text-gray-700">
            View your purchased NFT tickets.
          </p>
        </div>
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Wallet Disconnected</h3>
            <p className="text-gray-500 mb-4">
              Please connect your wallet to view your tickets.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
          <p className="mt-1 text-sm text-gray-700">
            View and manage your purchased NFT tickets.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Data source:</span>
          <Button 
            variant={useSubgraph ? "default" : "outline"} 
            size="sm"
            onClick={() => setUseSubgraph(!useSubgraph)}
          >
            {useSubgraph ? "📊 Subgraph" : "🔄 Mock Data"}
          </Button>
        </div>
      </div>

      {/* Error/Warning Banner */}
      {error && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardContent className="py-3">
            <p className="text-yellow-700 text-sm">⚠️ {error}</p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search by token ID, event name, or owner..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Tabs value={filter} onValueChange={setFilter} className="w-auto">
          <TabsList>
            <TabsTrigger value="all">All ({tickets.length})</TabsTrigger>
            <TabsTrigger value="active">
              Active ({tickets.filter(t => !t.isUsed).length})
            </TabsTrigger>
            <TabsTrigger value="used">
              Used ({tickets.filter(t => t.isUsed).length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tickets Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <TicketSkeleton key={i} />)}
        </div>
      ) : filteredTickets.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">🎫</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Tickets Found</h3>
            <p className="text-gray-500">
              {searchQuery ? 'Try adjusting your search criteria.' : 'You don\'t have any tickets yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTickets.map((ticket) => (
            <TicketCard 
              key={ticket.id} 
              ticket={ticket} 
              onRevealQR={handleRevealQR}
            />
          ))}
        </div>
      )}
    </div>
  )
}

