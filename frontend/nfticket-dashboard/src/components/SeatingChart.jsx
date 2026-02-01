/**
 * Seats.io Integration Component
 * Interactive seat selection for NFTicket events
 * @see https://docs.seats.io/docs/renderer
 */

import { useEffect, useRef, useState } from 'react'

// Seats.io configuration
const SEATSIO_PUBLIC_KEY = import.meta.env.VITE_SEATSIO_PUBLIC_KEY || ''
const SEATSIO_REGION = import.meta.env.VITE_SEATSIO_REGION || 'eu' // eu, na, sa, oc

/**
 * Load seats.io script dynamically
 */
function loadSeatsioScript() {
  return new Promise((resolve, reject) => {
    if (window.seatsio) {
      resolve(window.seatsio)
      return
    }

    const script = document.createElement('script')
    script.src = `https://cdn-${SEATSIO_REGION}.seatsio.net/chart.js`
    script.async = true
    script.onload = () => resolve(window.seatsio)
    script.onerror = reject
    document.head.appendChild(script)
  })
}

/**
 * SeatingChart Component
 * Renders an interactive seats.io chart for seat selection
 */
export function SeatingChart({
  eventKey,
  chartKey,
  onSeatSelected,
  onSeatDeselected,
  onSelectionValid,
  onSelectionInvalid,
  pricing = [],
  maxSelectedObjects = 10,
  mode = 'normal', // 'normal' | 'static' | 'print'
  className = '',
}) {
  const containerRef = useRef(null)
  const chartRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!SEATSIO_PUBLIC_KEY) {
      setError('Seats.io not configured - set VITE_SEATSIO_PUBLIC_KEY')
      setLoading(false)
      return
    }

    if (!chartKey) {
      setError('Chart key is required')
      setLoading(false)
      return
    }

    let chart = null

    async function initChart() {
      try {
        const seatsio = await loadSeatsioScript()
        
        chart = new seatsio.SeatingChart({
          divId: containerRef.current.id,
          publicKey: SEATSIO_PUBLIC_KEY,
          event: eventKey,
          chart: chartKey,
          mode,
          pricing,
          maxSelectedObjects,
          
          // Callbacks
          onChartRendered: () => {
            setLoading(false)
          },
          onChartRenderingFailed: (err) => {
            setError(err.message || 'Failed to render seating chart')
            setLoading(false)
          },
          onObjectSelected: (object, selectedTicketType) => {
            onSeatSelected?.(object, selectedTicketType)
          },
          onObjectDeselected: (object, deselectedTicketType) => {
            onSeatDeselected?.(object, deselectedTicketType)
          },
          onSelectionValid: () => {
            onSelectionValid?.()
          },
          onSelectionInvalid: (violations) => {
            onSelectionInvalid?.(violations)
          },
          
          // Styling
          colorScheme: 'dark',
          colors: {
            colorSelected: '#8247E5', // Polygon purple
            colorTitle: '#ffffff',
          },
        }).render()
        
        chartRef.current = chart
      } catch (err) {
        setError(err.message || 'Failed to load seats.io')
        setLoading(false)
      }
    }

    initChart()

    return () => {
      if (chart) {
        chart.destroy()
      }
    }
  }, [chartKey, eventKey, mode])

  // Generate unique container ID
  const containerId = `seatsio-chart-${chartKey?.slice(0, 8) || 'default'}`

  if (error) {
    return (
      <div className={`seatsio-error bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center ${className}`}>
        <p className="text-red-400">⚠️ {error}</p>
        <p className="text-sm text-gray-400 mt-2">
          Contact support or configure seats.io in environment variables
        </p>
      </div>
    )
  }

  return (
    <div className={`seatsio-container relative ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
        </div>
      )}
      <div 
        id={containerId} 
        ref={containerRef}
        className="w-full min-h-[500px] bg-gray-900 rounded-lg"
      />
    </div>
  )
}

/**
 * SeatSelectionSummary Component
 * Shows selected seats and total price
 */
export function SeatSelectionSummary({ selectedSeats = [], onCheckout }) {
  const totalPrice = selectedSeats.reduce((sum, seat) => {
    return sum + (seat.pricing?.price || 0)
  }, 0)

  if (selectedSeats.length === 0) {
    return (
      <div className="text-center text-gray-400 py-4">
        Click on seats to select them
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 space-y-4">
      <h3 className="font-semibold text-white">Selected Seats ({selectedSeats.length})</h3>
      
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {selectedSeats.map((seat) => (
          <div key={seat.id} className="flex justify-between text-sm">
            <span className="text-gray-300">
              {seat.labels?.section} - Row {seat.labels?.parent} - Seat {seat.labels?.own}
            </span>
            <span className="text-white font-medium">
              ${(seat.pricing?.price / 100).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-700 pt-4 flex justify-between items-center">
        <span className="text-lg font-semibold text-white">Total</span>
        <span className="text-xl font-bold text-purple-400">
          ${(totalPrice / 100).toFixed(2)}
        </span>
      </div>

      <button
        onClick={() => onCheckout?.(selectedSeats)}
        className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        Proceed to Checkout
      </button>
    </div>
  )
}

/**
 * Hook for managing seat selection state
 */
export function useSeatSelection() {
  const [selectedSeats, setSelectedSeats] = useState([])
  const [isValid, setIsValid] = useState(true)

  const handleSeatSelected = (seat, ticketType) => {
    setSelectedSeats(prev => [...prev, { ...seat, ticketType }])
  }

  const handleSeatDeselected = (seat) => {
    setSelectedSeats(prev => prev.filter(s => s.id !== seat.id))
  }

  const handleSelectionValid = () => setIsValid(true)
  const handleSelectionInvalid = () => setIsValid(false)

  const clearSelection = () => setSelectedSeats([])

  return {
    selectedSeats,
    isValid,
    handleSeatSelected,
    handleSeatDeselected,
    handleSelectionValid,
    handleSelectionInvalid,
    clearSelection,
  }
}

export default SeatingChart
