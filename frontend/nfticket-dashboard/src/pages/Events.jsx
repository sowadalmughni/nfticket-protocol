/**
 * Events Page
 * Manage events and deploy NFTicket contracts
 * @author Sowad Al-Mughni
 */

import { useState, useEffect } from 'react'
import { useAccount, useDeployContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { 
  PlusIcon, 
  CalendarIcon, 
  MapPinIcon,
  TicketIcon,
  CogIcon,
  EyeIcon,
  ArrowPathIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { SeatingChart, SeatSelectionSummary, useSeatSelection } from '@/components'
import NFTicketArtifact from '../lib/abis/NFTicket.json'

// Check if seats.io is configured
const SEATSIO_ENABLED = !!import.meta.env.VITE_SEATSIO_PUBLIC_KEY

export function Events() {
  const { address, isConnected } = useAccount()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showSeatMapDialog, setShowSeatMapDialog] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [events, setEvents] = useState([]) // Local state for demo, ideally fetched from Subgraph
  const [newEvent, setNewEvent] = useState({
    name: '',
    description: '',
    date: '',
    venue: '',
    royaltyCap: 5,
    maxPrice: '',
    seatsioChartKey: '', // Optional seats.io chart key
  })
  
  // Seat selection hook for purchase flow
  const seatSelection = useSeatSelection()

  // Contract Deployment Hook
  const { 
    deployContract, 
    data: deployHash, 
    isPending: isDeploying,
    error: deployError 
  } = useDeployContract()

  // Transaction Receipt Hook
  const { 
    isLoading: isWaitingForReceipt, 
    isSuccess: isDeploymentSuccess,
    data: receipt 
  } = useWaitForTransactionReceipt({
    hash: deployHash,
  })

  // Handle successful deployment
  useEffect(() => {
    if (isDeploymentSuccess && receipt) {
      console.log('Contract deployed at:', receipt.contractAddress)
      const deployedEvent = {
        id: Date.now(),
        ...newEvent,
        contractAddress: receipt.contractAddress,
        status: 'active',
        ticketsSold: 0,
        ticketsTotal: 0, // In this model, tickets are minted on demand or pre-minted? Constructor doesn't limit total supply
        ticketsUsed: 0,
      }
      setEvents(prev => [deployedEvent, ...prev])
      setShowCreateDialog(false)
      // Reset form
      setNewEvent({
        name: '',
        description: '',
        date: '',
        venue: '',
        royaltyCap: 5,
        maxPrice: '',
        seatsioChartKey: '',
      })
    }
  }, [isDeploymentSuccess, receipt])

  const handleCreateEvent = () => {
    if (!isConnected) return
    console.log('Deploying event contract...', newEvent)

    try {
      const dateTimestamp = Math.floor(new Date(newEvent.date).getTime() / 1000)
      const royaltyCapBps = Math.floor(parseFloat(newEvent.royaltyCap) * 100) // Convert % to basis points (e.g. 5% -> 500)
      const maxPriceWei = parseEther(newEvent.maxPrice.toString())

      deployContract({
        abi: NFTicketArtifact.abi,
        bytecode: NFTicketArtifact.bytecode,
        args: [
          newEvent.name,
          newEvent.description,
          BigInt(dateTimestamp),
          newEvent.venue,
          BigInt(royaltyCapBps),
          maxPriceWei,
          address // Creator is royalty recipient
        ],
      })
    } catch (err) {
      console.error("Preparation error:", err)
    }
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
    if (!dateString) return 'TBD'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const isLoading = isDeploying || isWaitingForReceipt

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
                Deploy a new NFTicket contract for your event. Gas fees apply.
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
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Event description..."
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Event Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  value={newEvent.venue}
                  onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
                  placeholder="Convention Center, San Francisco"
                  disabled={isLoading}
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
                    onChange={(e) => setNewEvent({ ...newEvent, royaltyCap: e.target.value })}
                    disabled={isLoading}
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
                    disabled={isLoading}
                  />
                </div>
              </div>
              {deployError && (
                <div className="text-red-500 text-sm">
                  Error: {deployError.shortMessage || deployError.message}
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleCreateEvent} disabled={!isConnected || isLoading}>
                {isLoading ? (
                    <>
                        <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                        {isWaitingForReceipt ? 'Confirming...' : 'Deploying...'}
                    </>
                ) : (
                    isConnected ? 'Deploy Contract' : 'Connect Wallet'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events created yet</h3>
            <p className="text-gray-500 mb-4">
              Create your first event to start selling NFT tickets.
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </CardContent>
        </Card>
      ) : (
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
                  {SEATSIO_ENABLED && event.seatsioChartKey && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedEvent(event)
                        setShowSeatMapDialog(true)
                      }}
                    >
                      <Squares2X2Icon className="h-4 w-4 mr-1" />
                      Seat Map
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Seat Map Dialog */}
      <Dialog open={showSeatMapDialog} onOpenChange={setShowSeatMapDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Seats - {selectedEvent?.name}</DialogTitle>
            <DialogDescription>
              Click on seats to select them for purchase
            </DialogDescription>
          </DialogHeader>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              {selectedEvent?.seatsioChartKey && (
                <SeatingChart
                  chartKey={selectedEvent.seatsioChartKey}
                  eventKey={selectedEvent.seatsioEventKey}
                  onSeatSelected={seatSelection.handleSeatSelected}
                  onSeatDeselected={seatSelection.handleSeatDeselected}
                  onSelectionValid={seatSelection.handleSelectionValid}
                  onSelectionInvalid={seatSelection.handleSelectionInvalid}
                  maxSelectedObjects={10}
                  className="min-h-[400px]"
                />
              )}
            </div>
            <div>
              <SeatSelectionSummary
                selectedSeats={seatSelection.selectedSeats}
                onCheckout={(seats) => {
                  console.log('Checkout with seats:', seats)
                  // TODO: Integrate with Stripe checkout
                  setShowSeatMapDialog(false)
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

