/**
 * POAPs Page
 * Manage POAP distribution for events
 * @author Sowad Al-Mughni
 */

import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { POAP_DISTRIBUTOR_ABI, CONTRACT_ADDRESSES } from '@/lib/wagmi'

// Mock POAP claims data (would come from subgraph)
const mockClaims = [
  { id: 1, claimer: '0x1234...5678', tokenId: 0, claimedAt: '2026-01-28 14:30', eventName: 'Web3 Conference 2024' },
  { id: 2, claimer: '0xabcd...ef01', tokenId: 1, claimedAt: '2026-01-28 15:45', eventName: 'Web3 Conference 2024' },
  { id: 3, claimer: '0x9876...5432', tokenId: 2, claimedAt: '2026-01-29 10:15', eventName: 'Web3 Conference 2024' },
]

export function POAPs() {
  const { isConnected, chain } = useAccount()
  const [claimAddress, setClaimAddress] = useState('')
  const [batchAddresses, setBatchAddresses] = useState('')
  const [newMaxSupply, setNewMaxSupply] = useState('')
  
  // Get contract address for current chain
  const contractAddress = chain?.id && CONTRACT_ADDRESSES[chain.id]?.poapDistributor

  // Read POAP event info
  const { data: eventInfo, isLoading: loadingEventInfo } = useReadContract({
    address: contractAddress,
    abi: POAP_DISTRIBUTOR_ABI,
    functionName: 'getEventInfo',
    query: { enabled: !!contractAddress && contractAddress !== '0x...' }
  })

  // Read distribution status
  const { data: distributionActive } = useReadContract({
    address: contractAddress,
    abi: POAP_DISTRIBUTOR_ABI,
    functionName: 'distributionActive',
    query: { enabled: !!contractAddress && contractAddress !== '0x...' }
  })

  // Write functions
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Handlers
  const handleClaimDirect = () => {
    if (!claimAddress || !contractAddress) return
    writeContract({
      address: contractAddress,
      abi: POAP_DISTRIBUTOR_ABI,
      functionName: 'claimPOAPDirect',
      args: [claimAddress]
    })
    setClaimAddress('')
  }

  const handleBatchClaim = () => {
    if (!batchAddresses || !contractAddress) return
    const addresses = batchAddresses.split('\n').map(a => a.trim()).filter(a => a.startsWith('0x'))
    if (addresses.length === 0) return
    
    writeContract({
      address: contractAddress,
      abi: POAP_DISTRIBUTOR_ABI,
      functionName: 'batchClaimPOAP',
      args: [addresses]
    })
    setBatchAddresses('')
  }

  const handleToggleDistribution = () => {
    if (!contractAddress) return
    writeContract({
      address: contractAddress,
      abi: POAP_DISTRIBUTOR_ABI,
      functionName: 'setDistributionActive',
      args: [!distributionActive]
    })
  }

  const handleUpdateMaxSupply = () => {
    if (!newMaxSupply || !contractAddress) return
    writeContract({
      address: contractAddress,
      abi: POAP_DISTRIBUTOR_ABI,
      functionName: 'setMaxSupply',
      args: [BigInt(newMaxSupply)]
    })
    setNewMaxSupply('')
  }

  // Mock data for display when contract not connected
  const claimed = eventInfo ? Number(eventInfo[4]) : 127
  const maxSupply = eventInfo ? Number(eventInfo[5]) : 500
  const active = distributionActive ?? true
  const progress = (claimed / maxSupply) * 100

  if (!isConnected) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">POAPs</h1>
          <p className="mt-2 text-sm text-gray-700">Connect your wallet to manage POAP distribution.</p>
        </div>
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-gray-500">Please connect your wallet to continue.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">POAP Distribution</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage Proof of Attendance Protocol tokens for your events.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Distribution</span>
            <Switch checked={active} onCheckedChange={handleToggleDistribution} disabled={isPending} />
            <Badge variant={active ? 'default' : 'secondary'}>
              {active ? 'Active' : 'Paused'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Claimed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{claimed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Max Supply</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{maxSupply}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Remaining</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{maxSupply - claimed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{progress.toFixed(1)}%</div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Transaction Status */}
      {(isPending || isConfirming || isSuccess) && (
        <Card className={isSuccess ? 'border-green-500 bg-green-50' : 'border-blue-500 bg-blue-50'}>
          <CardContent className="py-4">
            {isPending && <p className="text-blue-700">⏳ Waiting for wallet confirmation...</p>}
            {isConfirming && <p className="text-blue-700">⏳ Transaction confirming...</p>}
            {isSuccess && <p className="text-green-700">✅ Transaction confirmed!</p>}
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="claim" className="space-y-4">
        <TabsList>
          <TabsTrigger value="claim">Claim POAPs</TabsTrigger>
          <TabsTrigger value="history">Claim History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="claim" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Single Claim */}
            <Card>
              <CardHeader>
                <CardTitle>Single Claim</CardTitle>
                <CardDescription>Claim a POAP for a single attendee</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="claimAddress">Wallet Address</Label>
                  <Input
                    id="claimAddress"
                    placeholder="0x..."
                    value={claimAddress}
                    onChange={(e) => setClaimAddress(e.target.value)}
                  />
                </div>
                <Button onClick={handleClaimDirect} disabled={isPending || !claimAddress} className="w-full">
                  {isPending ? 'Processing...' : 'Claim POAP'}
                </Button>
              </CardContent>
            </Card>

            {/* Batch Claim */}
            <Card>
              <CardHeader>
                <CardTitle>Batch Claim</CardTitle>
                <CardDescription>Claim POAPs for multiple attendees at once</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="batchAddresses">Wallet Addresses (one per line)</Label>
                  <textarea
                    id="batchAddresses"
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="0x1234...&#10;0x5678...&#10;0xabcd..."
                    value={batchAddresses}
                    onChange={(e) => setBatchAddresses(e.target.value)}
                  />
                </div>
                <Button onClick={handleBatchClaim} disabled={isPending || !batchAddresses} className="w-full">
                  {isPending ? 'Processing...' : 'Batch Claim POAPs'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Recent Claims</CardTitle>
              <CardDescription>History of POAP claims for this event</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token ID</TableHead>
                    <TableHead>Claimer</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Claimed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockClaims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell className="font-mono">#{claim.tokenId}</TableCell>
                      <TableCell className="font-mono">{claim.claimer}</TableCell>
                      <TableCell>{claim.eventName}</TableCell>
                      <TableCell>{claim.claimedAt}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>POAP Settings</CardTitle>
              <CardDescription>Configure POAP distribution parameters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="maxSupply">Update Max Supply</Label>
                <div className="flex gap-2">
                  <Input
                    id="maxSupply"
                    type="number"
                    placeholder={`Current: ${maxSupply}`}
                    value={newMaxSupply}
                    onChange={(e) => setNewMaxSupply(e.target.value)}
                  />
                  <Button onClick={handleUpdateMaxSupply} disabled={isPending || !newMaxSupply}>
                    Update
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Cannot be set lower than current claimed amount ({claimed})
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

