/**
 * Events Page
 * Manage events and deploy NFTicket contracts
 * @author Sowad Al-Mughni
 */

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { 
  PlusIcon, 
  CalendarIcon, 
  MapPinIcon,
  TicketIcon,
  CogIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

// Mock events data
const events = [
  {
    id: 1,
    name: 'Web3 Conference 2024',
    description: 'The premier Web3 and blockchain conference',
    date: '2024-08-15',
    venue: 'Convention Center, San Francisco',
    ticketsTotal: 1000,
    ticketsSold: 750,
    ticketsUsed: 650,
    royaltyCap: 5,
    maxPrice: '1.0',
    status: 'active',
    contractAddress: '0x1234567890123456789012345678901234567890',
  },
  {
    id: 2,
    name: 'NFT Art Gallery Opening',
    description: 'Exclusive NFT art exhibition opening night',
    date: '2024-07-20',
    venue: 'Modern Art Museum, New York',
    ticketsTotal: 200,
    ticketsSold: 200,
    ticketsUsed: 180,
    royaltyCap: 10,
    maxPrice: '0.5',
    status: 'completed',
    contractAddress: '0x9876543210987654321098765432109876543210',
  },
  {
    id: 3,
    name: 'DeFi Summit 2024',
    description: 'Decentralized finance summit and networking',
    date: '2024-09-10',
    venue: 'Tech Hub, London',
    ticketsTotal: 500,
    ticketsSold: 120,
    ticketsUsed: 0,
    royaltyCap: 7.5,
    maxPrice: '0.8',
    status: 'upcoming',
    contractAddress: null,
  },
]

export function Events() {
  const { address, isConnected } = useAccount()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    date: '',
    venue: '',
    royaltyCap: 5,
    maxPrice: '',
  })

  const handleCreateEvent = () => {
    // In a real app, this would deploy a new NFTicket contract
    console.log('Creating event:', newEvent)
    setShowCreateDialog(false)
    setNewEvent({
      name: '',
      description: '',
      date: '',
      venue: '',
      royaltyCap: 5,
      maxPrice: '',
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'upcoming':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your events and deploy NFTicket contracts.
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                Deploy a new NFTicket contract for your event.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Event Name</Label>
                <Input
                  id="name"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                  placeholder="Web3 Conference 2024"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Event description..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Event Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  value={newEvent.venue}
                  onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                  placeholder="Convention Center, San Francisco"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="royaltyCap">Royalty Cap (%)</Label>
                  <Input
                    id="royaltyCap"
                    type="number"
                    min="0"
                    max="25"
                    value={newEvent.royaltyCap}
                    onChange={(e) => setNewEvent({ ...newEvent, royaltyCap: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="maxPrice">Max Price (ETH)</Label>
                  <Input
                    id="maxPrice"
                    type="number"
                    step="0.01"
                    value={newEvent.maxPrice}
                    onChange={(e) => setNewEvent({ ...newEvent, maxPrice: e.target.value })}
                    placeholder="1.0"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateEvent} disabled={!isConnected}>
                {isConnected ? 'Deploy Contract' : 'Connect Wallet'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {events.map((event) => (
          <Card key={event.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{event.name}</CardTitle>
                  <Badge className={getStatusColor(event.status)}>
                    {event.status}
                  </Badge>
                </div>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm">
                    <EyeIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <CogIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription className="line-clamp-2">
                {event.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Event Details */}
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  {formatDate(event.date)}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPinIcon className="h-4 w-4 mr-2" />
                  {event.venue}
                </div>
              </div>

              {/* Ticket Stats */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tickets Sold</span>
                  <span className="font-medium">
                    {event.ticketsSold} / {event.ticketsTotal}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(event.ticketsSold / event.ticketsTotal) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Used</span>
                  <span className="font-medium">{event.ticketsUsed}</span>
                </div>
              </div>

              {/* Contract Info */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Royalty Cap</span>
                  <span className="font-medium">{event.royaltyCap}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Max Price</span>
                  <span className="font-medium">{event.maxPrice} ETH</span>
                </div>
                {event.contractAddress && (
                  <div className="text-xs text-gray-500 font-mono">
                    {event.contractAddress.slice(0, 10)}...{event.contractAddress.slice(-8)}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-2">
                <Button size="sm" className="flex-1">
                  <TicketIcon className="h-4 w-4 mr-1" />
                  Mint Tickets
                </Button>
                {event.status === 'upcoming' && !event.contractAddress && (
                  <Button size="sm" variant="outline" className="flex-1">
                    Deploy Contract
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {events.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-500 mb-4">
              Create your first event to start selling NFT tickets.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

