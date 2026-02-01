/**
 * ThemeProvider
 * Provides white-label theming via CSS custom properties
 * @author Sowad Al-Mughni
 */
import { createContext, useContext, useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Default theme configuration
const defaultTheme = {
  primaryColor: '#3B82F6',
  secondaryColor: '#10B981',
  accentColor: '#8B5CF6',
  backgroundColor: '#FFFFFF',
  surfaceColor: '#F9FAFB',
  textColor: '#111827',
  textSecondary: '#6B7280',
  logoUrl: null,
  faviconUrl: null,
  fontFamily: 'Inter',
  headingFont: 'Inter',
  showPoweredBy: true,
}

const ThemeContext = createContext({
  theme: defaultTheme,
  organizer: null,
  isLoading: true,
  setTheme: () => {},
  resetTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

/**
 * Apply theme to CSS custom properties
 */
function applyThemeToCss(theme) {
  const root = document.documentElement
  
  root.style.setProperty('--nft-primary', theme.primaryColor)
  root.style.setProperty('--nft-secondary', theme.secondaryColor)
  root.style.setProperty('--nft-accent', theme.accentColor)
  root.style.setProperty('--nft-background', theme.backgroundColor)
  root.style.setProperty('--nft-surface', theme.surfaceColor)
  root.style.setProperty('--nft-text', theme.textColor)
  root.style.setProperty('--nft-text-secondary', theme.textSecondary)
  root.style.setProperty('--nft-font-family', `'${theme.fontFamily}', system-ui, sans-serif`)
  root.style.setProperty('--nft-heading-font', `'${theme.headingFont}', system-ui, sans-serif`)

  // Update favicon if provided
  if (theme.faviconUrl) {
    let link = document.querySelector("link[rel~='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = theme.faviconUrl
  }
}

export function ThemeProvider({ children, slug = null }) {
  const [theme, setThemeState] = useState(defaultTheme)
  const [organizer, setOrganizer] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch theme on mount
  useEffect(() => {
    async function fetchTheme() {
      try {
        // Determine which theme to fetch
        const endpoint = slug 
          ? `${API_BASE}/themes/${slug}`
          : `${API_BASE}/themes`

        const response = await fetch(endpoint)
        
        if (response.ok) {
          const data = await response.json()
          const fetchedTheme = data.theme || data.defaultTheme || defaultTheme
          
          setThemeState({ ...defaultTheme, ...fetchedTheme })
          setOrganizer(data.organizer || null)
          applyThemeToCss({ ...defaultTheme, ...fetchedTheme })
        }
      } catch (error) {
        console.error('Failed to fetch theme:', error)
        applyThemeToCss(defaultTheme)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTheme()
  }, [slug])

  // Update theme
  const setTheme = (newTheme) => {
    const merged = { ...theme, ...newTheme }
    setThemeState(merged)
    applyThemeToCss(merged)
  }

  // Reset to default
  const resetTheme = () => {
    setThemeState(defaultTheme)
    applyThemeToCss(defaultTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, organizer, isLoading, setTheme, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * Hook to get current theme colors for styled components
 */
export function useThemeColors() {
  const { theme } = useTheme()
  
  return {
    primary: theme.primaryColor,
    secondary: theme.secondaryColor,
    accent: theme.accentColor,
    background: theme.backgroundColor,
    surface: theme.surfaceColor,
    text: theme.textColor,
    textSecondary: theme.textSecondary,
  }
}

/**
 * Powered by badge component
 */
export function PoweredByBadge() {
  const { theme } = useTheme()
  
  if (!theme.showPoweredBy) return null

  return (
    <div className="text-center py-4 text-sm text-gray-500">
      Powered by{' '}
      <a 
        href="https://nfticket.io" 
        target="_blank" 
        rel="noopener noreferrer"
        className="font-medium hover:text-blue-600"
      >
        NFTicket Protocol
      </a>
    </div>
  )
}

export default ThemeProvider
