/**
 * Settings Page
 * Configure NFTicket protocol settings and contract parameters
 * @author Sowad Al-Mughni
 */

import { useState } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { NFTICKET_ABI, POAP_DISTRIBUTOR_ABI, CONTRACT_ADDRESSES } from '@/lib/wagmi'

export function Settings() {
  const { isConnected, address, chain } = useAccount()
  
  // Form states
  const [newRoyaltyCap, setNewRoyaltyCap] = useState('')
  const [newMaxPrice, setNewMaxPrice] = useState('')
  const [newRoyaltyRecipient, setNewRoyaltyRecipient] = useState('')
  const [newBaseURI, setNewBaseURI] = useState('')

  // Get contract addresses
  const nfticketAddress = chain?.id && CONTRACT_ADDRESSES[chain.id]?.nfticket
  const poapAddress = chain?.id && CONTRACT_ADDRESSES[chain.id]?.poapDistributor

  // Read current NFTicket settings
  const { data: currentRoyaltyCap } = useReadContract({
    address: nfticketAddress,
    abi: NFTICKET_ABI,
    functionName: 'royaltyCap',
    query: { enabled: !!nfticketAddress && nfticketAddress !== '0x...' }
  })

  const { data: currentMaxPrice } = useReadContract({
    address: nfticketAddress,
    abi: NFTICKET_ABI,
    functionName: 'maxPrice',
    query: { enabled: !!nfticketAddress && nfticketAddress !== '0x...' }
  })

  const { data: currentRoyaltyRecipient } = useReadContract({
    address: nfticketAddress,
    abi: NFTICKET_ABI,
    functionName: 'royaltyRecipient',
    query: { enabled: !!nfticketAddress && nfticketAddress !== '0x...' }
  })

  // Write contract hooks
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Handlers for NFTicket settings
  const handleUpdateRoyaltyCap = () => {
    if (!newRoyaltyCap || !nfticketAddress) return
    const basisPoints = Math.floor(parseFloat(newRoyaltyCap) * 100) // Convert percentage to basis points
    writeContract({
      address: nfticketAddress,
      abi: NFTICKET_ABI,
      functionName: 'setRoyaltyCap',
      args: [BigInt(basisPoints)]
    })
    setNewRoyaltyCap('')
  }

  const handleUpdateMaxPrice = () => {
    if (!newMaxPrice || !nfticketAddress) return
    writeContract({
      address: nfticketAddress,
      abi: NFTICKET_ABI,
      functionName: 'setMaxPrice',
      args: [parseEther(newMaxPrice)]
    })
    setNewMaxPrice('')
  }

  const handleUpdateRoyaltyRecipient = () => {
    if (!newRoyaltyRecipient || !nfticketAddress) return
    writeContract({
      address: nfticketAddress,
      abi: NFTICKET_ABI,
      functionName: 'setRoyaltyRecipient',
      args: [newRoyaltyRecipient]
    })
    setNewRoyaltyRecipient('')
  }

  const handleUpdateBaseURI = () => {
    if (!newBaseURI || !poapAddress) return
    writeContract({
      address: poapAddress,
      abi: POAP_DISTRIBUTOR_ABI,
      functionName: 'setBaseTokenURI',
      args: [newBaseURI]
    })
    setNewBaseURI('')
  }

  // Display values (with mock fallbacks)
  const displayRoyaltyCap = currentRoyaltyCap ? Number(currentRoyaltyCap) / 100 : 5
  const displayMaxPrice = currentMaxPrice ? formatEther(currentMaxPrice) : '1.0'
  const displayRecipient = currentRoyaltyRecipient || address || '0x...'

  if (!isConnected) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-700">Connect your wallet to configure settings.</p>
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-700">
          Configure your NFTicket protocol settings and contract parameters.
        </p>
      </div>

      {/* Transaction Status */}
      {(isPending || isConfirming || isSuccess) && (
        <Card className={isSuccess ? 'border-green-500 bg-green-50' : 'border-blue-500 bg-blue-50'}>
          <CardContent className="py-4">
            {isPending && <p className="text-blue-700">⏳ Waiting for wallet confirmation...</p>}
            {isConfirming && <p className="text-blue-700">⏳ Transaction confirming...</p>}
            {isSuccess && <p className="text-green-700">✅ Settings updated successfully!</p>}
          </CardContent>
        </Card>
      )}

      {/* Connected Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Account</CardTitle>
          <CardDescription>Your current wallet connection details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Address</span>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">{address}</code>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Network</span>
            <Badge>{chain?.name || 'Unknown'}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Chain ID</span>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">{chain?.id}</code>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="nfticket" className="space-y-4">
        <TabsList>
          <TabsTrigger value="nfticket">NFTicket Settings</TabsTrigger>
          <TabsTrigger value="poap">POAP Settings</TabsTrigger>
          <TabsTrigger value="contracts">Contract Addresses</TabsTrigger>
        </TabsList>

        <TabsContent value="nfticket" className="space-y-4">
          {/* Anti-Scalping Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Anti-Scalping Configuration</CardTitle>
              <CardDescription>Configure price caps and royalty settings to prevent ticket scalping</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Royalty Cap */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="royaltyCap">Royalty Cap (%)</Label>
                  <Badge variant="outline">Current: {displayRoyaltyCap}%</Badge>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="royaltyCap"
                    type="number"
                    step="0.5"
                    min="0"
                    max="25"
                    placeholder="Enter new royalty cap"
                    value={newRoyaltyCap}
                    onChange={(e) => setNewRoyaltyCap(e.target.value)}
                  />
                  <Button onClick={handleUpdateRoyaltyCap} disabled={isPending || !newRoyaltyCap}>
                    Update
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Maximum royalty percentage for secondary sales (max 25%)
                </p>
              </div>

              <Separator />

              {/* Max Price */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="maxPrice">Maximum Price (ETH)</Label>
                  <Badge variant="outline">Current: {displayMaxPrice} ETH</Badge>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="maxPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Enter new max price"
                    value={newMaxPrice}
                    onChange={(e) => setNewMaxPrice(e.target.value)}
                  />
                  <Button onClick={handleUpdateMaxPrice} disabled={isPending || !newMaxPrice}>
                    Update
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Maximum allowed price for secondary market sales
                </p>
              </div>

              <Separator />

              {/* Royalty Recipient */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="royaltyRecipient">Royalty Recipient</Label>
                  <Badge variant="outline" className="font-mono text-xs">
                    {displayRecipient.slice(0, 6)}...{displayRecipient.slice(-4)}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="royaltyRecipient"
                    placeholder="0x..."
                    value={newRoyaltyRecipient}
                    onChange={(e) => setNewRoyaltyRecipient(e.target.value)}
                  />
                  <Button onClick={handleUpdateRoyaltyRecipient} disabled={isPending || !newRoyaltyRecipient}>
                    Update
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Address that receives royalties from secondary sales
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="poap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>POAP Metadata Configuration</CardTitle>
              <CardDescription>Configure POAP token metadata settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="baseURI">Base Token URI</Label>
                <div className="flex gap-2">
                  <Input
                    id="baseURI"
                    placeholder="https://api.example.com/poap/metadata/"
                    value={newBaseURI}
                    onChange={(e) => setNewBaseURI(e.target.value)}
                  />
                  <Button onClick={handleUpdateBaseURI} disabled={isPending || !newBaseURI}>
                    Update
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  Base URI for POAP token metadata (token ID will be appended)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployed Contract Addresses</CardTitle>
              <CardDescription>Contract addresses for the current network</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>NFTicket Contract</Label>
                <code className="block w-full p-3 bg-gray-100 rounded text-sm font-mono break-all">
                  {nfticketAddress || 'Not configured for this network'}
                </code>
              </div>
              <div className="space-y-2">
                <Label>POAP Distributor Contract</Label>
                <code className="block w-full p-3 bg-gray-100 rounded text-sm font-mono break-all">
                  {poapAddress || 'Not configured for this network'}
                </code>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-gray-500">
                Update contract addresses in <code>src/lib/wagmi.js</code> after deployment
              </p>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Network Configuration</CardTitle>
              <CardDescription>Supported networks and their status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'Ethereum Mainnet', id: 1, status: 'Not Deployed' },
                  { name: 'Sepolia Testnet', id: 11155111, status: 'Not Deployed' },
                  { name: 'Polygon', id: 137, status: 'Not Deployed' },
                  { name: 'Localhost', id: 31337, status: 'Development' },
                ].map((network) => (
                  <div key={network.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{network.name}</span>
                      <code className="text-xs bg-gray-100 px-1 rounded">{network.id}</code>
                    </div>
                    <Badge variant={chain?.id === network.id ? 'default' : 'outline'}>
                      {chain?.id === network.id ? 'Connected' : network.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

