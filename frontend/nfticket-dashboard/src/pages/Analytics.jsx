/**
 * Analytics Page
 * View detailed analytics and insights for events
 * @author Sowad Al-Mughni
 */

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Mock analytics data (would come from subgraph)
const mockStats = {
  totalTicketsMinted: 1247,
  totalTicketsUsed: 892,
  totalVolume: '156.8',
  totalRoyalties: '7.84',
  averagePrice: '0.125',
  uniqueHolders: 743,
}

const mockDailyData = [
  { date: '2026-01-25', minted: 45, used: 12, volume: '5.4', royalties: '0.27' },
  { date: '2026-01-26', minted: 78, used: 34, volume: '9.2', royalties: '0.46' },
  { date: '2026-01-27', minted: 156, used: 67, volume: '18.7', royalties: '0.94' },
  { date: '2026-01-28', minted: 234, used: 89, volume: '28.1', royalties: '1.41' },
  { date: '2026-01-29', minted: 189, used: 145, volume: '22.7', royalties: '1.14' },
  { date: '2026-01-30', minted: 312, used: 287, volume: '37.4', royalties: '1.87' },
  { date: '2026-01-31', minted: 233, used: 258, volume: '35.3', royalties: '1.75' },
]

const mockTopEvents = [
  { name: 'Web3 Conference 2024', tickets: 456, volume: '57.0', used: 342 },
  { name: 'NFT Art Exhibition', tickets: 312, volume: '31.2', used: 289 },
  { name: 'DeFi Summit London', tickets: 234, volume: '42.1', used: 156 },
  { name: 'Crypto Meetup NYC', tickets: 156, volume: '15.6', used: 78 },
  { name: 'Blockchain Dev Workshop', tickets: 89, volume: '10.9', used: 27 },
]

const mockRecentTransfers = [
  { tokenId: 1234, from: '0x1234...5678', to: '0xabcd...ef01', price: '0.15', royalty: '0.0075', time: '2 mins ago' },
  { tokenId: 1156, from: '0x9876...5432', to: '0x1111...2222', price: '0.12', royalty: '0.0060', time: '5 mins ago' },
  { tokenId: 1089, from: '0xaaaa...bbbb', to: '0xcccc...dddd', price: '0.18', royalty: '0.0090', time: '12 mins ago' },
  { tokenId: 987, from: '0xeeee...ffff', to: '0x7777...8888', price: '0.10', royalty: '0.0050', time: '18 mins ago' },
  { tokenId: 856, from: '0x3333...4444', to: '0x5555...6666', price: '0.25', royalty: '0.0125', time: '25 mins ago' },
]

export function Analytics() {
  const { isConnected } = useAccount()
  const [timeRange, setTimeRange] = useState('7d')

  // Simple bar chart using CSS
  const maxMinted = Math.max(...mockDailyData.map(d => d.minted))

  if (!isConnected) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-2 text-sm text-gray-700">Connect your wallet to view analytics.</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-2 text-sm text-gray-700">
            View detailed insights and metrics for your events.
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24 hours</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Minted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalTicketsMinted.toLocaleString()}</div>
            <p className="text-xs text-green-600">+12.5% from last period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalTicketsUsed.toLocaleString()}</div>
            <p className="text-xs text-green-600">+8.3% from last period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Usage Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((mockStats.totalTicketsUsed / mockStats.totalTicketsMinted) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-gray-500">Of minted tickets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalVolume} ETH</div>
            <p className="text-xs text-green-600">+23.1% from last period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Royalties Earned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalRoyalties} ETH</div>
            <p className="text-xs text-green-600">5% of volume</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Unique Holders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.uniqueHolders.toLocaleString()}</div>
            <p className="text-xs text-green-600">+45 new this period</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Tables */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Top Events</TabsTrigger>
          <TabsTrigger value="transfers">Recent Transfers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity</CardTitle>
              <CardDescription>Tickets minted and used over time</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Simple CSS-based bar chart */}
              <div className="space-y-3">
                {mockDailyData.map((day) => (
                  <div key={day.date} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-gray-500">{day.date.slice(5)}</div>
                    <div className="flex-1 flex gap-2">
                      <div className="flex-1">
                        <div 
                          className="h-6 bg-blue-500 rounded text-xs text-white flex items-center px-2"
                          style={{ width: `${(day.minted / maxMinted) * 100}%` }}
                        >
                          {day.minted}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div 
                          className="h-6 bg-green-500 rounded text-xs text-white flex items-center px-2"
                          style={{ width: `${(day.used / maxMinted) * 100}%` }}
                        >
                          {day.used}
                        </div>
                      </div>
                    </div>
                    <div className="w-20 text-right text-sm font-medium">{day.volume} ETH</div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Minted</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Used</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Top Events by Volume</CardTitle>
              <CardDescription>Best performing events in selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Name</TableHead>
                    <TableHead className="text-right">Tickets</TableHead>
                    <TableHead className="text-right">Volume (ETH)</TableHead>
                    <TableHead className="text-right">Used</TableHead>
                    <TableHead className="text-right">Usage Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockTopEvents.map((event, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{event.name}</TableCell>
                      <TableCell className="text-right">{event.tickets}</TableCell>
                      <TableCell className="text-right">{event.volume}</TableCell>
                      <TableCell className="text-right">{event.used}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={event.used / event.tickets > 0.7 ? 'default' : 'secondary'}>
                          {((event.used / event.tickets) * 100).toFixed(0)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfers">
          <Card>
            <CardHeader>
              <CardTitle>Recent Secondary Sales</CardTitle>
              <CardDescription>Latest ticket transfers with royalty payments</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token ID</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead className="text-right">Price (ETH)</TableHead>
                    <TableHead className="text-right">Royalty (ETH)</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRecentTransfers.map((transfer, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono">#{transfer.tokenId}</TableCell>
                      <TableCell className="font-mono text-gray-500">{transfer.from}</TableCell>
                      <TableCell className="font-mono text-gray-500">{transfer.to}</TableCell>
                      <TableCell className="text-right font-medium">{transfer.price}</TableCell>
                      <TableCell className="text-right text-green-600">{transfer.royalty}</TableCell>
                      <TableCell className="text-right text-gray-500">{transfer.time}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

