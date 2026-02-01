/**
 * Dashboard Page
 * Main dashboard with overview metrics and subgraph integration
 * @author Sowad Al-Mughni
 */
import { useState, useEffect, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { createGraphClient, GET_PROTOCOL_STATS, GET_RECENT_TRANSFERS } from '@/lib/graphql'
import { Link } from 'react-router-dom'

// Mock stats fallback
const mockStats = {
  totalTickets: 1234,
  totalPOAPs: 856,
  totalRevenue: '12.345',
  activeUsers: 2345
}

const mockActivity = [
  { id: 1, type: 'ticket', message: 'New ticket minted for Web3 Conference 2024', time: '2 minutes ago' },
  { id: 2, type: 'poap', message: 'POAP claimed by 0x1234...5678', time: '5 minutes ago' },
  { id: 3, type: 'ticket', message: 'Ticket #102 verified at venue', time: '12 minutes ago' },
  { id: 4, type: 'transfer', message: 'Ticket #95 transferred to 0xabcd...efgh', time: '1 hour ago' }
]

function StatCard({ name, value, change, icon, loading }) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center">
            <Skeleton className="h-8 w-8 rounded" />
            <div className="ml-5 flex-1">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0 text-2xl">{icon}</div>
          <div className="ml-5 w-0 flex-1">
            <p className="text-sm font-medium text-gray-500 truncate">{name}</p>
            <div className="flex items-baseline">
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
              {change && (
                <span className={`ml-2 text-sm font-semibold ${
                  change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                }`}>
                  {change}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityItem({ type, message, time }) {
  const icons = {
    ticket: { icon: '🎫', color: 'bg-blue-500' },
    poap: { icon: '🏆', color: 'bg-green-500' },
    transfer: { icon: '↔️', color: 'bg-purple-500' },
    default: { icon: '📌', color: 'bg-gray-500' }
  }
  
  const { icon, color } = icons[type] || icons.default

  return (
    <li>
      <div className="relative pb-6">
        <div className="relative flex space-x-3">
          <div>
            <span className={`h-8 w-8 rounded-full ${color} flex items-center justify-center ring-8 ring-white text-sm`}>
              {icon}
            </span>
          </div>
          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
            <p className="text-sm text-gray-600">{message}</p>
            <time className="text-sm text-gray-400 whitespace-nowrap">{time}</time>
          </div>
        </div>
      </div>
    </li>
  )
}

export function Dashboard() {
  const { isConnected, chain } = useAccount()
  const [stats, setStats] = useState(null)
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  // Create graph client
  const graphClient = useMemo(() => {
    if (chain?.id) {
      return createGraphClient(chain.id)
    }
    return null
  }, [chain?.id])

  // Fetch data from subgraph
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      
      try {
        if (graphClient) {
          const [statsResult, transfersResult] = await Promise.all([
            graphClient.query({ query: GET_PROTOCOL_STATS }),
            graphClient.query({ query: GET_RECENT_TRANSFERS, variables: { first: 5 } })
          ])

          if (statsResult.data?.protocolStats?.[0]) {
            const s = statsResult.data.protocolStats[0]
            setStats({
              totalTickets: parseInt(s.totalTickets || 0),
              totalPOAPs: parseInt(s.totalPOAPs || 0),
              totalRevenue: formatEther(BigInt(s.totalRevenue || 0)),
              activeUsers: parseInt(s.uniqueHolders || 0)
            })
          } else {
            setStats(mockStats)
          }

          if (transfersResult.data?.transfers) {
            setActivity(transfersResult.data.transfers.map((t, i) => ({
              id: i,
              type: 'transfer',
              message: `Ticket #${t.tokenId} transferred from ${t.from.slice(0, 6)}...${t.from.slice(-4)} to ${t.to.slice(0, 6)}...${t.to.slice(-4)}`,
              time: new Date(parseInt(t.timestamp) * 1000).toRelativeTime?.() || 'Recently'
            })))
          } else {
            setActivity(mockActivity)
          }
        } else {
          setStats(mockStats)
          setActivity(mockActivity)
        }
      } catch (err) {
        console.warn('Subgraph query failed:', err.message)
        setStats(mockStats)
        setActivity(mockActivity)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [graphClient])

  const statCards = [
    { name: 'Total Tickets', value: stats?.totalTickets?.toLocaleString() || '0', change: '+4.6%', icon: '🎫' },
    { name: 'POAPs Distributed', value: stats?.totalPOAPs?.toLocaleString() || '0', change: '+7.3%', icon: '🏆' },
    { name: 'Total Revenue', value: `${parseFloat(stats?.totalRevenue || 0).toFixed(3)} ETH`, change: '+3.8%', icon: '💰' },
    { name: 'Active Users', value: stats?.activeUsers?.toLocaleString() || '0', change: '+12.4%', icon: '👥' }
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-700">
            Overview of your NFTicket protocol performance and metrics.
          </p>
        </div>
        {!isConnected && (
          <span className="text-sm text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
            ⚠️ Connect wallet for live data
          </span>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((item) => (
          <StatCard key={item.name} {...item} loading={loading} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex space-x-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="-mb-4">
                {activity.slice(0, 4).map((item) => (
                  <ActivityItem key={item.id} {...item} />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/events">
                <Button className="w-full h-20 flex flex-col items-center justify-center gap-2" variant="default">
                  <span className="text-2xl">🎫</span>
                  <span>Create Event</span>
                </Button>
              </Link>
              <Link to="/poaps">
                <Button className="w-full h-20 flex flex-col items-center justify-center gap-2" variant="outline">
                  <span className="text-2xl">🏆</span>
                  <span>Deploy POAP</span>
                </Button>
              </Link>
              <Link to="/analytics">
                <Button className="w-full h-20 flex flex-col items-center justify-center gap-2" variant="outline">
                  <span className="text-2xl">📊</span>
                  <span>View Analytics</span>
                </Button>
              </Link>
              <Link to="/settings">
                <Button className="w-full h-20 flex flex-col items-center justify-center gap-2" variant="outline">
                  <span className="text-2xl">⚙️</span>
                  <span>Settings</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

