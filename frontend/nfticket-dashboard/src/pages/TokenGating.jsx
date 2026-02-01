/**
 * Token Gating Page
 * Configure and manage token-gated experiences
 * @author Sowad Al-Mughni
 */
import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Rule type options
const RULE_TYPES = {
  own_any: 'Own Any Token',
  own_specific: 'Own Specific Token',
  own_min: 'Own Minimum Count',
}

const REWARD_TYPES = {
  access: { label: 'Content Access', icon: '🔓' },
  discount: { label: 'Discount', icon: '💰' },
  badge: { label: 'Badge', icon: '🏅' },
  download: { label: 'Download', icon: '📥' },
}

function RuleCard({ rule, onEdit, onToggle, onDelete }) {
  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg">{rule.name}</CardTitle>
          <CardDescription className="mt-1">{rule.description}</CardDescription>
        </div>
        <Badge variant={rule.active ? 'default' : 'secondary'}>
          {rule.active ? 'Active' : 'Inactive'}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Requirements */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Requirements:</p>
            <div className="flex flex-wrap gap-2">
              {rule.requirements?.map((req, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {RULE_TYPES[req.ruleType] || req.ruleType}
                  {req.minCount && ` (${req.minCount}+)`}
                </Badge>
              ))}
            </div>
          </div>

          {/* Reward */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Reward:</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{REWARD_TYPES[rule.reward?.type]?.icon || '🎁'}</span>
              <span className="text-sm">{rule.reward?.name || 'Unlock Access'}</span>
              {rule.reward?.discountPercent && (
                <Badge className="bg-green-100 text-green-800">
                  {rule.reward.discountPercent}% OFF
                </Badge>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button size="sm" variant="outline" onClick={() => onEdit(rule)}>
              Edit
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onToggle(rule.id, !rule.active)}
            >
              {rule.active ? 'Disable' : 'Enable'}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-red-600 hover:text-red-700"
              onClick={() => onDelete(rule.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CreateRuleForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    id: '',
    name: '',
    description: '',
    contractAddress: '',
    chainId: 31337,
    ruleType: 'own_any',
    minCount: 1,
    rewardType: 'access',
    rewardName: '',
    discountPercent: 10,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    const rule = {
      id: form.id || form.name.toLowerCase().replace(/\s+/g, '-'),
      name: form.name,
      description: form.description,
      requirements: [{
        contractAddress: form.contractAddress,
        chainId: parseInt(form.chainId),
        tokenType: 'ERC721',
        ruleType: form.ruleType,
        minCount: form.ruleType === 'own_min' ? parseInt(form.minCount) : undefined,
      }],
      requireAll: true,
      reward: {
        type: form.rewardType,
        name: form.rewardName,
        ...(form.rewardType === 'discount' && { discountPercent: parseInt(form.discountPercent) }),
        ...(form.rewardType === 'access' && { contentUrl: `/gated/content/${form.id}` }),
      }
    }

    onSubmit(rule)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Gating Rule</CardTitle>
        <CardDescription>Define token requirements for exclusive access</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rule Name</Label>
              <Input 
                placeholder="VIP Access"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Rule ID (optional)</Label>
              <Input 
                placeholder="vip-access"
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input 
              placeholder="Unlock exclusive VIP content"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contract Address</Label>
              <Input 
                placeholder="0x..."
                value={form.contractAddress}
                onChange={(e) => setForm({ ...form, contractAddress: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Chain ID</Label>
              <select 
                className="w-full h-10 px-3 border rounded-md"
                value={form.chainId}
                onChange={(e) => setForm({ ...form, chainId: e.target.value })}
              >
                <option value="1">Ethereum Mainnet</option>
                <option value="137">Polygon</option>
                <option value="8453">Base</option>
                <option value="42161">Arbitrum</option>
                <option value="11155111">Sepolia</option>
                <option value="31337">Local</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rule Type</Label>
              <select 
                className="w-full h-10 px-3 border rounded-md"
                value={form.ruleType}
                onChange={(e) => setForm({ ...form, ruleType: e.target.value })}
              >
                {Object.entries(RULE_TYPES).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            {form.ruleType === 'own_min' && (
              <div className="space-y-2">
                <Label>Minimum Count</Label>
                <Input 
                  type="number"
                  min="1"
                  value={form.minCount}
                  onChange={(e) => setForm({ ...form, minCount: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Reward Configuration</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Reward Type</Label>
                <select 
                  className="w-full h-10 px-3 border rounded-md"
                  value={form.rewardType}
                  onChange={(e) => setForm({ ...form, rewardType: e.target.value })}
                >
                  {Object.entries(REWARD_TYPES).map(([value, { label, icon }]) => (
                    <option key={value} value={value}>{icon} {label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Reward Name</Label>
                <Input 
                  placeholder="VIP Livestream Access"
                  value={form.rewardName}
                  onChange={(e) => setForm({ ...form, rewardName: e.target.value })}
                  required
                />
              </div>
            </div>
            {form.rewardType === 'discount' && (
              <div className="mt-4 space-y-2">
                <Label>Discount Percentage</Label>
                <Input 
                  type="number"
                  min="1"
                  max="100"
                  value={form.discountPercent}
                  onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
                />
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit">Create Rule</Button>
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export function TokenGating() {
  const { isConnected } = useAccount()
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [activeTab, setActiveTab] = useState('rules')

  // Fetch rules
  useEffect(() => {
    async function fetchRules() {
      try {
        const response = await fetch(`${API_BASE}/gated/rules`)
        if (response.ok) {
          const data = await response.json()
          setRules(data.rules || [])
        }
      } catch (error) {
        console.error('Failed to fetch rules:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchRules()
  }, [])

  const handleCreateRule = async (rule) => {
    try {
      const response = await fetch(`${API_BASE}/gated/admin/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      })

      if (response.ok) {
        const data = await response.json()
        setRules([...rules, { ...data.rule, requirementsCount: data.rule.requirements?.length }])
        setShowCreateForm(false)
      }
    } catch (error) {
      console.error('Failed to create rule:', error)
    }
  }

  const handleToggleRule = async (ruleId, active) => {
    try {
      const response = await fetch(`${API_BASE}/gated/admin/rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      })

      if (response.ok) {
        setRules(rules.map(r => r.id === ruleId ? { ...r, active } : r))
      }
    } catch (error) {
      console.error('Failed to toggle rule:', error)
    }
  }

  const handleDeleteRule = async (ruleId) => {
    if (!confirm('Are you sure you want to delete this rule?')) return

    try {
      const response = await fetch(`${API_BASE}/gated/admin/rules/${ruleId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setRules(rules.filter(r => r.id !== ruleId))
      }
    } catch (error) {
      console.error('Failed to delete rule:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Token Gating</h1>
          <p className="mt-1 text-sm text-gray-700">
            Configure exclusive experiences based on NFT ownership
          </p>
        </div>
        {!showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)}>
            + Create Rule
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="rules">Gating Rules</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4">
          {showCreateForm && (
            <CreateRuleForm 
              onSubmit={handleCreateRule}
              onCancel={() => setShowCreateForm(false)}
            />
          )}

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map(i => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-60 mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : rules.length === 0 && !showCreateForm ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="text-6xl mb-4">🔐</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Gating Rules</h3>
                <p className="text-gray-500 mb-4">
                  Create your first token-gated experience
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  Create Rule
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {rules.map(rule => (
                <RuleCard 
                  key={rule.id}
                  rule={rule}
                  onEdit={() => {}}
                  onToggle={handleToggleRule}
                  onDelete={handleDeleteRule}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Gating Analytics</CardTitle>
              <CardDescription>Track how users interact with gated content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-gray-900">{rules.length}</div>
                  <div className="text-sm text-gray-500">Active Rules</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-gray-900">1,234</div>
                  <div className="text-sm text-gray-500">Access Checks</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-gray-900">892</div>
                  <div className="text-sm text-gray-500">Unlocks</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-3xl font-bold text-gray-900">72%</div>
                  <div className="text-sm text-gray-500">Success Rate</div>
                </div>
              </div>
              <p className="text-sm text-gray-500 text-center">
                Detailed analytics coming in a future update
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
