/**
 * Branding Page
 * Configure white-label branding and theming
 * @author Sowad Al-Mughni
 */
import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Color preset palettes
const COLOR_PRESETS = [
  {
    name: 'Default Blue',
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#8B5CF6',
  },
  {
    name: 'Forest',
    primary: '#059669',
    secondary: '#0D9488',
    accent: '#10B981',
  },
  {
    name: 'Sunset',
    primary: '#F97316',
    secondary: '#EAB308',
    accent: '#EF4444',
  },
  {
    name: 'Royal',
    primary: '#7C3AED',
    secondary: '#6366F1',
    accent: '#EC4899',
  },
  {
    name: 'Midnight',
    primary: '#1E40AF',
    secondary: '#3730A3',
    accent: '#6366F1',
  },
  {
    name: 'Rose',
    primary: '#E11D48',
    secondary: '#DB2777',
    accent: '#F43F5E',
  },
]

// Available fonts
const FONTS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Source Sans Pro',
  'Raleway',
]

function ColorPicker({ label, value, onChange }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded cursor-pointer border"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-28 font-mono text-sm"
          placeholder="#3B82F6"
        />
      </div>
    </div>
  )
}

function ThemePreview({ theme }) {
  return (
    <div 
      className="rounded-lg border overflow-hidden"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      {/* Header */}
      <div 
        className="p-4 border-b"
        style={{ backgroundColor: theme.surfaceColor }}
      >
        <div className="flex items-center justify-between">
          <div 
            className="font-bold text-lg"
            style={{ 
              color: theme.textColor,
              fontFamily: theme.headingFont,
            }}
          >
            {theme.logoUrl ? (
              <img src={theme.logoUrl} alt="Logo" className="h-8" />
            ) : (
              'Your Brand'
            )}
          </div>
          <div className="flex gap-2">
            <div 
              className="px-3 py-1 rounded text-sm text-white"
              style={{ backgroundColor: theme.primaryColor }}
            >
              Primary
            </div>
            <div 
              className="px-3 py-1 rounded text-sm text-white"
              style={{ backgroundColor: theme.secondaryColor }}
            >
              Secondary
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        <h3 
          style={{ 
            color: theme.textColor,
            fontFamily: theme.headingFont,
          }}
          className="text-xl font-bold mb-2"
        >
          Event Title
        </h3>
        <p 
          style={{ 
            color: theme.textSecondary,
            fontFamily: theme.fontFamily,
          }}
          className="text-sm mb-4"
        >
          This is how your event descriptions will look with your custom theme.
        </p>
        
        {/* Sample tickets */}
        <div className="grid grid-cols-2 gap-3">
          <div 
            className="p-3 rounded-lg border"
            style={{ backgroundColor: theme.surfaceColor }}
          >
            <div 
              className="text-sm font-medium"
              style={{ color: theme.textColor }}
            >
              General Admission
            </div>
            <div 
              className="text-xs mt-1"
              style={{ color: theme.textSecondary }}
            >
              Starting at $50
            </div>
            <button
              className="mt-2 w-full py-1 rounded text-white text-sm"
              style={{ backgroundColor: theme.accentColor }}
            >
              Buy Ticket
            </button>
          </div>
          <div 
            className="p-3 rounded-lg border"
            style={{ backgroundColor: theme.surfaceColor }}
          >
            <div 
              className="text-sm font-medium"
              style={{ color: theme.textColor }}
            >
              VIP Access
            </div>
            <div 
              className="text-xs mt-1"
              style={{ color: theme.textSecondary }}
            >
              Starting at $150
            </div>
            <button
              className="mt-2 w-full py-1 rounded text-white text-sm"
              style={{ backgroundColor: theme.primaryColor }}
            >
              Buy Ticket
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      {theme.showPoweredBy && (
        <div 
          className="p-3 text-center text-xs border-t"
          style={{ 
            backgroundColor: theme.surfaceColor,
            color: theme.textSecondary,
          }}
        >
          Powered by NFTicket Protocol
        </div>
      )}
    </div>
  )
}

export function Branding() {
  const { address, isConnected } = useAccount()
  const [isOrganizer, setIsOrganizer] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('colors')
  
  const [organizer, setOrganizer] = useState({
    name: '',
    slug: '',
    email: '',
  })

  const [theme, setTheme] = useState({
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    accentColor: '#8B5CF6',
    backgroundColor: '#FFFFFF',
    surfaceColor: '#F9FAFB',
    textColor: '#111827',
    textSecondary: '#6B7280',
    logoUrl: '',
    faviconUrl: '',
    bannerUrl: '',
    fontFamily: 'Inter',
    headingFont: 'Inter',
    customCss: '',
    mobileHeaderColor: '#FFFFFF',
    mobileTabBarColor: '#FFFFFF',
    mobileAccentColor: '#3B82F6',
    showPoweredBy: true,
    customDomain: '',
  })

  // Fetch current theme
  useEffect(() => {
    async function fetchTheme() {
      if (!isConnected) {
        setLoading(false)
        return
      }

      try {
        const token = localStorage.getItem('authToken')
        if (!token) {
          setLoading(false)
          return
        }

        const response = await fetch(`${API_BASE}/themes/my-theme`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          setOrganizer(data.organizer)
          setTheme(prev => ({ ...prev, ...data.theme }))
          setIsOrganizer(true)
        }
      } catch (error) {
        console.error('Failed to fetch theme:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTheme()
  }, [isConnected])

  // Register as organizer
  const handleRegister = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return

      const response = await fetch(`${API_BASE}/themes/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(organizer),
      })

      if (response.ok) {
        const data = await response.json()
        setOrganizer(data.organizer)
        setTheme(prev => ({ ...prev, ...data.theme }))
        setIsOrganizer(true)
      }
    } catch (error) {
      console.error('Failed to register:', error)
    }
  }

  // Save theme
  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return

      const response = await fetch(`${API_BASE}/themes/my-theme`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(theme),
      })

      if (response.ok) {
        const data = await response.json()
        setTheme(prev => ({ ...prev, ...data.theme }))
      }
    } catch (error) {
      console.error('Failed to save theme:', error)
    } finally {
      setSaving(false)
    }
  }

  // Apply preset
  const applyPreset = (preset) => {
    setTheme(prev => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
    }))
  }

  // Update theme field
  const updateTheme = (field, value) => {
    setTheme(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (!isConnected) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <div className="text-6xl mb-4">🎨</div>
          <h3 className="text-lg font-medium mb-2">Connect Wallet</h3>
          <p className="text-gray-500">
            Connect your wallet to customize your branding
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!isOrganizer) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branding</h1>
          <p className="mt-1 text-sm text-gray-700">
            Register as an organizer to customize your white-label experience
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Become an Organizer</CardTitle>
            <CardDescription>
              Set up your brand identity for NFTicket Protocol
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Organization Name</Label>
              <Input
                placeholder="Your Company Name"
                value={organizer.name}
                onChange={(e) => setOrganizer(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>URL Slug</Label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-2">nfticket.io/</span>
                <Input
                  placeholder="your-brand"
                  value={organizer.slug}
                  onChange={(e) => setOrganizer(prev => ({ 
                    ...prev, 
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                  }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email (optional)</Label>
              <Input
                type="email"
                placeholder="contact@yourcompany.com"
                value={organizer.email}
                onChange={(e) => setOrganizer(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <Button 
              onClick={handleRegister}
              disabled={!organizer.name || !organizer.slug}
            >
              Register as Organizer
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Branding</h1>
          <p className="mt-1 text-sm text-gray-700">
            Customize your white-label experience for {organizer.name}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Editor */}
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="colors" className="flex-1">Colors</TabsTrigger>
              <TabsTrigger value="typography" className="flex-1">Typography</TabsTrigger>
              <TabsTrigger value="assets" className="flex-1">Assets</TabsTrigger>
              <TabsTrigger value="advanced" className="flex-1">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="space-y-4">
              {/* Color Presets */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Color Presets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        className="p-2 rounded border hover:border-gray-400 transition-colors"
                        onClick={() => applyPreset(preset)}
                      >
                        <div className="flex gap-1 mb-1">
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.primary }} />
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.secondary }} />
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.accent }} />
                        </div>
                        <div className="text-xs text-gray-600">{preset.name}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Custom Colors */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Brand Colors</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <ColorPicker
                    label="Primary"
                    value={theme.primaryColor}
                    onChange={(v) => updateTheme('primaryColor', v)}
                  />
                  <ColorPicker
                    label="Secondary"
                    value={theme.secondaryColor}
                    onChange={(v) => updateTheme('secondaryColor', v)}
                  />
                  <ColorPicker
                    label="Accent"
                    value={theme.accentColor}
                    onChange={(v) => updateTheme('accentColor', v)}
                  />
                  <ColorPicker
                    label="Background"
                    value={theme.backgroundColor}
                    onChange={(v) => updateTheme('backgroundColor', v)}
                  />
                  <ColorPicker
                    label="Surface"
                    value={theme.surfaceColor}
                    onChange={(v) => updateTheme('surfaceColor', v)}
                  />
                  <ColorPicker
                    label="Text"
                    value={theme.textColor}
                    onChange={(v) => updateTheme('textColor', v)}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="typography" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label>Body Font</Label>
                    <select
                      className="w-full p-2 border rounded"
                      value={theme.fontFamily}
                      onChange={(e) => updateTheme('fontFamily', e.target.value)}
                    >
                      {FONTS.map(font => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Heading Font</Label>
                    <select
                      className="w-full p-2 border rounded"
                      value={theme.headingFont}
                      onChange={(e) => updateTheme('headingFont', e.target.value)}
                    >
                      {FONTS.map(font => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="assets" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <Label>Logo URL</Label>
                    <Input
                      placeholder="https://..."
                      value={theme.logoUrl}
                      onChange={(e) => updateTheme('logoUrl', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Favicon URL</Label>
                    <Input
                      placeholder="https://..."
                      value={theme.faviconUrl}
                      onChange={(e) => updateTheme('faviconUrl', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Banner URL</Label>
                    <Input
                      placeholder="https://..."
                      value={theme.bannerUrl}
                      onChange={(e) => updateTheme('bannerUrl', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show "Powered by NFTicket"</Label>
                      <p className="text-sm text-gray-500">
                        Display attribution in footer
                      </p>
                    </div>
                    <Switch
                      checked={theme.showPoweredBy}
                      onCheckedChange={(v) => updateTheme('showPoweredBy', v)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Custom Domain</Label>
                    <Input
                      placeholder="tickets.yourdomain.com"
                      value={theme.customDomain}
                      onChange={(e) => updateTheme('customDomain', e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      Contact support to configure DNS
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Custom CSS</Label>
                    <textarea
                      className="w-full h-32 p-2 font-mono text-sm border rounded"
                      placeholder="/* Your custom CSS */"
                      value={theme.customCss}
                      onChange={(e) => updateTheme('customCss', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-700">Live Preview</h3>
          <ThemePreview theme={theme} />
          
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-gray-500">
                Your branded URL:{' '}
                <a 
                  href={`/org/${organizer.slug}`}
                  className="text-blue-600 hover:underline"
                >
                  nfticket.io/org/{organizer.slug}
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
