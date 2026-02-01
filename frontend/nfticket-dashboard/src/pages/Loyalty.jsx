/**
 * Loyalty Page
 * Manage loyalty points program and view analytics
 * @author Sowad Al-Mughni
 */
import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Tier colors
const TIER_COLORS = {
  Bronze: 'bg-amber-100 text-amber-800',
  Silver: 'bg-gray-100 text-gray-800',
  Gold: 'bg-yellow-100 text-yellow-800',
  Platinum: 'bg-blue-100 text-blue-800',
  Diamond: 'bg-purple-100 text-purple-800',
}

function TierCard({ tier, isActive }) {
  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all ${
        isActive 
          ? 'border-blue-500 shadow-lg' 
          : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <Badge className={TIER_COLORS[tier.name] || 'bg-gray-100'}>
          {tier.name}
        </Badge>
        {isActive && (
          <Badge className="bg-blue-500 text-white">Current</Badge>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900">
        {tier.threshold.toLocaleString()}
      </div>
      <div className="text-sm text-gray-500">points required</div>
      {tier.discountPercent > 0 && (
        <div className="mt-2 text-sm font-medium text-green-600">
          {tier.discountPercent}% discount
        </div>
      )}
    </div>
  )
}

function LeaderboardRow({ rank, address, points }) {
  const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`
  
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          rank === 1 ? 'bg-yellow-100 text-yellow-800' :
          rank === 2 ? 'bg-gray-100 text-gray-800' :
          rank === 3 ? 'bg-amber-100 text-amber-800' :
          'bg-gray-50 text-gray-600'
        }`}>
          {rank}
        </div>
        <div>
          <div className="font-mono text-sm text-gray-900">{shortAddress}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-bold text-gray-900">{points.toLocaleString()}</div>
        <div className="text-xs text-gray-500">points</div>
      </div>
    </div>
  )
}

export function Loyalty() {
  const { isConnected } = useAccount()
  const [tiers, setTiers] = useState([])
  const [earningRates, setEarningRates] = useState(null)
  const [stats, setStats] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const [tiersRes, ratesRes, statsRes, leaderboardRes] = await Promise.all([
          fetch(`${API_BASE}/loyalty/tiers`),
          fetch(`${API_BASE}/loyalty/earning-rates`),
          fetch(`${API_BASE}/loyalty/stats`),
          fetch(`${API_BASE}/loyalty/leaderboard?limit=10`),
        ])

        if (tiersRes.ok) {
          const data = await tiersRes.json()
          setTiers(data.tiers || [])
        }

        if (ratesRes.ok) {
          const data = await ratesRes.json()
          setEarningRates(data)
        }

        if (statsRes.ok) {
          const data = await statsRes.json()
          setStats(data)
        }

        if (leaderboardRes.ok) {
          const data = await leaderboardRes.json()
          setLeaderboard(data.leaderboard || [])
        }
      } catch (error) {
        console.error('Failed to fetch loyalty data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Loyalty Program</h1>
        <p className="mt-1 text-sm text-gray-700">
          Manage tiers, earning rates, and track engagement
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-gray-900">
              {stats?.totalUsers?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-500">Total Members</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-gray-900">
              {stats?.totalPoints?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-500">Total Points Issued</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-gray-900">
              {stats?.averagePoints?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-500">Avg Points/Member</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-gray-900">
              {(stats?.tierDistribution?.Diamond || 0) + 
               (stats?.tierDistribution?.Platinum || 0)}
            </div>
            <div className="text-sm text-gray-500">VIP Members</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tiers">Tiers</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Earning Rates */}
          <Card>
            <CardHeader>
              <CardTitle>Earning Rates</CardTitle>
              <CardDescription>Points awarded for different actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl mb-2">🎫</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {earningRates?.ticketPurchase || 100}
                  </div>
                  <div className="text-sm text-gray-500">Ticket Purchase</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl mb-2">✓</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {earningRates?.attendance || 50}
                  </div>
                  <div className="text-sm text-gray-500">Event Attendance</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl mb-2">🏆</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {earningRates?.poap || 25}
                  </div>
                  <div className="text-sm text-gray-500">POAP Claimed</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl mb-2">👥</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {earningRates?.referral || 200}
                  </div>
                  <div className="text-sm text-gray-500">Referral</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tier Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Member Distribution</CardTitle>
              <CardDescription>Members by tier</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats?.tierDistribution || {}).map(([tier, count]) => {
                  const total = stats?.totalUsers || 1
                  const percent = Math.round((count / total) * 100)
                  
                  return (
                    <div key={tier} className="flex items-center gap-4">
                      <Badge className={`w-20 justify-center ${TIER_COLORS[tier] || ''}`}>
                        {tier}
                      </Badge>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-24 text-right">
                        <span className="font-medium">{count}</span>
                        <span className="text-gray-500 ml-1">({percent}%)</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tiers">
          <Card>
            <CardHeader>
              <CardTitle>Loyalty Tiers</CardTitle>
              <CardDescription>
                Configure tier thresholds and benefits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-4">
                {tiers.map((tier, index) => (
                  <TierCard 
                    key={tier.name}
                    tier={tier}
                    isActive={index === 0}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle>Top Members</CardTitle>
              <CardDescription>
                Users with the most loyalty points
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🏆</div>
                  <p className="text-gray-500">No members yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {leaderboard.map(entry => (
                    <LeaderboardRow 
                      key={entry.address}
                      rank={entry.rank}
                      address={entry.address}
                      points={entry.points}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Program Settings</CardTitle>
              <CardDescription>
                Configure loyalty program parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Earning Rates</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-500">Points per Ticket Purchase</label>
                      <Input type="number" defaultValue={earningRates?.ticketPurchase || 100} />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Points per Attendance</label>
                      <Input type="number" defaultValue={earningRates?.attendance || 50} />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Points per POAP</label>
                      <Input type="number" defaultValue={earningRates?.poap || 25} />
                    </div>
                    <div>
                      <label className="text-sm text-gray-500">Points per Referral</label>
                      <Input type="number" defaultValue={earningRates?.referral || 200} />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Contract Settings</h4>
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Earning rate changes require an on-chain transaction.
                      Deploy the LoyaltyPoints contract to enable on-chain points.
                    </p>
                  </div>
                  <Button variant="outline" disabled>
                    Deploy LoyaltyPoints Contract
                  </Button>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
