/**
 * Tickets Page
 * View and manage NFT tickets (Mock Subgraph Data)
 * @author Sowad Al-Mughni
 */
import { useAccount } from 'wagmi'
import { TicketIcon, QrCodeIcon } from '@heroicons/react/24/outline'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
// import { useQuery, gql } from '@apollo/client'

// -- REAL SUBGRAPH QUERY (Uncomment when Subgraph is deployed) --
// const GET_MY_TICKETS = gql`
//   query GetMyTickets($owner: String!) {
//     tickets(where: { owner: $owner }) {
//       id
//       tokenId
//       event {
//         name
//       }
//       price
//       isUsed
//       purchaseDate
//     }
//   }
// `

// Mock Data representing Subgraph query result
const mockTickets = [
  {
    id: "1",
    tokenId: "101",
    eventName: "Web3 Conference 2024",
    price: "0.5 ETH",
    isUsed: false,
    owner: "0x123...abc",
    purchaseDate: "2024-02-01"
  },
  {
    id: "2",
    tokenId: "102",
    eventName: "NFT Art Exhibition",
    price: "0.2 ETH",
    isUsed: true,
    owner: "0x456...def",
    purchaseDate: "2024-01-15"
  },
  {
    id: "3",
    tokenId: "105",
    eventName: "DeFi Summit London",
    price: "0.8 ETH",
    isUsed: false,
    owner: "0x789...ghi",
    purchaseDate: "2024-03-10"
  }
]

export function Tickets() {
  const { isConnected } = useAccount()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
        <p className="mt-2 text-sm text-gray-700">
          View your purchased NFT tickets.
        </p>
      </div>
      
      {!isConnected ? (
        <Card className="text-center py-12">
            <CardContent>
                <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Wallet Disconnected</h3>
                <p className="text-gray-500 mb-4">
                  Please connect your wallet to view your tickets.
                </p>
            </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockTickets.map((ticket) => (
                <Card key={ticket.id} className="flex flex-col">
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
                    <CardContent>
                        <div className="text-2xl font-bold mb-1">{ticket.eventName}</div>
                        <p className="text-xs text-muted-foreground mb-4">
                            Purchased: {ticket.purchaseDate} • {ticket.price}
                        </p>
                        <div className="mt-auto pt-4 border-t">
                             <Button className="w-full" disabled={ticket.isUsed} variant={ticket.isUsed ? "outline" : "default"}>
                                <QrCodeIcon className="mr-2 h-4 w-4" />
                                {ticket.isUsed ? "Ticket Redeemed" : "Reveal QR Code"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      )}
    </div>
  )
}

