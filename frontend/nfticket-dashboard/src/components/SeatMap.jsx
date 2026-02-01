/**
 * SeatMap Component
 * Interactive venue seat selection for ticket purchasing
 * @author Sowad Al-Mughni
 */
import { useState, useEffect, useMemo } from 'react'
import { cn } from '@/lib/utils'

// Default venue configuration
const DEFAULT_VENUE = {
  name: 'Default Venue',
  sections: [
    {
      id: 'vip',
      name: 'VIP Section',
      category: 'VIP',
      rows: 3,
      seatsPerRow: 10,
      priceMultiplier: 2.5,
      color: '#7C3AED',
    },
    {
      id: 'premium',
      name: 'Premium Section',
      category: 'Premium',
      rows: 5,
      seatsPerRow: 15,
      priceMultiplier: 1.5,
      color: '#3B82F6',
    },
    {
      id: 'general-left',
      name: 'General Left',
      category: 'General',
      rows: 8,
      seatsPerRow: 12,
      priceMultiplier: 1.0,
      color: '#10B981',
    },
    {
      id: 'general-center',
      name: 'General Center',
      category: 'General',
      rows: 8,
      seatsPerRow: 20,
      priceMultiplier: 1.0,
      color: '#10B981',
    },
    {
      id: 'general-right',
      name: 'General Right',
      category: 'General',
      rows: 8,
      seatsPerRow: 12,
      priceMultiplier: 1.0,
      color: '#10B981',
    },
  ],
}

// Seat status enum
const SEAT_STATUS = {
  AVAILABLE: 'available',
  SELECTED: 'selected',
  SOLD: 'sold',
  RESERVED: 'reserved',
}

function Seat({ 
  seat, 
  isSelected, 
  isSold, 
  isReserved,
  onClick, 
  sectionColor,
  showLabel = false,
}) {
  const status = isSold ? SEAT_STATUS.SOLD : 
                 isReserved ? SEAT_STATUS.RESERVED :
                 isSelected ? SEAT_STATUS.SELECTED : 
                 SEAT_STATUS.AVAILABLE

  return (
    <button
      className={cn(
        'w-6 h-6 rounded-sm text-xs font-medium transition-all duration-150',
        'flex items-center justify-center',
        'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1',
        {
          'cursor-pointer': status === SEAT_STATUS.AVAILABLE,
          'cursor-not-allowed': status === SEAT_STATUS.SOLD || status === SEAT_STATUS.RESERVED,
          'bg-gray-200 text-gray-400': status === SEAT_STATUS.SOLD,
          'bg-yellow-200 text-yellow-600': status === SEAT_STATUS.RESERVED,
          'ring-2 ring-blue-500': status === SEAT_STATUS.SELECTED,
        }
      )}
      style={{
        backgroundColor: status === SEAT_STATUS.AVAILABLE ? sectionColor + '40' :
                        status === SEAT_STATUS.SELECTED ? sectionColor :
                        undefined,
        color: status === SEAT_STATUS.SELECTED ? '#fff' : undefined,
      }}
      onClick={onClick}
      disabled={status === SEAT_STATUS.SOLD || status === SEAT_STATUS.RESERVED}
      title={`${seat.section} Row ${seat.row} Seat ${seat.seatNumber}`}
    >
      {showLabel ? seat.seatNumber : ''}
    </button>
  )
}

function Section({ 
  section, 
  selectedSeats, 
  soldSeats, 
  reservedSeats,
  onSeatClick,
  showLabels = false,
}) {
  // Generate seats for this section
  const seats = useMemo(() => {
    const result = []
    for (let row = 1; row <= section.rows; row++) {
      for (let seatNum = 1; seatNum <= section.seatsPerRow; seatNum++) {
        result.push({
          id: `${section.id}-${row}-${seatNum}`,
          section: section.id,
          sectionName: section.name,
          row: String(row),
          seatNumber: String(seatNum),
          category: section.category,
          priceMultiplier: section.priceMultiplier,
        })
      }
    }
    return result
  }, [section])

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <div 
          className="w-4 h-4 rounded"
          style={{ backgroundColor: section.color }}
        />
        <h3 className="font-medium text-gray-700">{section.name}</h3>
        <span className="text-sm text-gray-500">
          ({section.rows} rows × {section.seatsPerRow} seats)
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <div className="inline-block">
          {Array.from({ length: section.rows }, (_, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 mb-1">
              <span className="w-6 text-xs text-gray-400 text-right mr-1">
                {rowIndex + 1}
              </span>
              {seats
                .filter(s => s.row === String(rowIndex + 1))
                .map(seat => (
                  <Seat
                    key={seat.id}
                    seat={seat}
                    isSelected={selectedSeats.has(seat.id)}
                    isSold={soldSeats.has(seat.id)}
                    isReserved={reservedSeats.has(seat.id)}
                    onClick={() => onSeatClick(seat)}
                    sectionColor={section.color}
                    showLabel={showLabels}
                  />
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function SeatMap({
  venue = DEFAULT_VENUE,
  basePrice = 50,
  soldSeats = new Set(),
  reservedSeats = new Set(),
  maxSelectable = 10,
  onSelectionChange,
  showLabels = false,
  readOnly = false,
}) {
  const [selectedSeats, setSelectedSeats] = useState(new Set())

  // Handle seat click
  const handleSeatClick = (seat) => {
    if (readOnly) return

    setSelectedSeats(prev => {
      const newSelected = new Set(prev)
      
      if (newSelected.has(seat.id)) {
        newSelected.delete(seat.id)
      } else {
        if (newSelected.size >= maxSelectable) {
          return prev // Don't add more than max
        }
        newSelected.add(seat.id)
      }
      
      return newSelected
    })
  }

  // Notify parent of selection changes
  useEffect(() => {
    if (onSelectionChange) {
      const selectedDetails = Array.from(selectedSeats).map(seatId => {
        const [sectionId, row, seatNum] = seatId.split('-')
        const section = venue.sections.find(s => s.id === sectionId)
        return {
          id: seatId,
          section: sectionId,
          sectionName: section?.name || sectionId,
          row,
          seatNumber: seatNum,
          category: section?.category || 'General',
          price: basePrice * (section?.priceMultiplier || 1),
        }
      })
      onSelectionChange(selectedDetails)
    }
  }, [selectedSeats, onSelectionChange, venue, basePrice])

  // Calculate totals
  const selectedDetails = useMemo(() => {
    return Array.from(selectedSeats).map(seatId => {
      const [sectionId] = seatId.split('-')
      const section = venue.sections.find(s => s.id === sectionId)
      return {
        id: seatId,
        price: basePrice * (section?.priceMultiplier || 1),
      }
    })
  }, [selectedSeats, venue, basePrice])

  const totalPrice = selectedDetails.reduce((sum, s) => sum + s.price, 0)

  return (
    <div className="space-y-6">
      {/* Stage indicator */}
      <div className="text-center">
        <div className="inline-block px-20 py-3 bg-gray-800 text-white rounded-lg font-medium">
          STAGE
        </div>
      </div>

      {/* Sections */}
      <div className="p-4 bg-gray-50 rounded-lg">
        {venue.sections.map(section => (
          <Section
            key={section.id}
            section={section}
            selectedSeats={selectedSeats}
            soldSeats={soldSeats}
            reservedSeats={reservedSeats}
            onSeatClick={handleSeatClick}
            showLabels={showLabels}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-sm bg-green-200 border-2 border-green-500" />
          <span className="text-gray-600">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-sm bg-blue-500" />
          <span className="text-gray-600">Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-sm bg-gray-200" />
          <span className="text-gray-600">Sold</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-sm bg-yellow-200" />
          <span className="text-gray-600">Reserved</span>
        </div>
      </div>

      {/* Selection summary */}
      {!readOnly && selectedSeats.size > 0 && (
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium text-blue-900">
                {selectedSeats.size} seat{selectedSeats.size !== 1 ? 's' : ''} selected
              </span>
              <span className="text-blue-600 ml-2">
                (max {maxSelectable})
              </span>
            </div>
            <div className="text-xl font-bold text-blue-900">
              ${totalPrice.toFixed(2)}
            </div>
          </div>
          <button
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            onClick={() => setSelectedSeats(new Set())}
          >
            Clear selection
          </button>
        </div>
      )}
    </div>
  )
}

// Venue configuration builder component
export function VenueBuilder({ initialVenue, onChange }) {
  const [venue, setVenue] = useState(initialVenue || DEFAULT_VENUE)
  const [editingSection, setEditingSection] = useState(null)

  const addSection = () => {
    const newSection = {
      id: `section-${Date.now()}`,
      name: 'New Section',
      category: 'General',
      rows: 5,
      seatsPerRow: 10,
      priceMultiplier: 1.0,
      color: '#6B7280',
    }
    const newVenue = {
      ...venue,
      sections: [...venue.sections, newSection],
    }
    setVenue(newVenue)
    onChange?.(newVenue)
    setEditingSection(newSection.id)
  }

  const updateSection = (sectionId, updates) => {
    const newVenue = {
      ...venue,
      sections: venue.sections.map(s => 
        s.id === sectionId ? { ...s, ...updates } : s
      ),
    }
    setVenue(newVenue)
    onChange?.(newVenue)
  }

  const removeSection = (sectionId) => {
    const newVenue = {
      ...venue,
      sections: venue.sections.filter(s => s.id !== sectionId),
    }
    setVenue(newVenue)
    onChange?.(newVenue)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Venue Configuration</h3>
        <button
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={addSection}
        >
          + Add Section
        </button>
      </div>

      <div className="space-y-3">
        {venue.sections.map(section => (
          <div 
            key={section.id}
            className="p-3 border rounded-lg bg-white"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: section.color }}
                />
                <input
                  className="font-medium border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                  value={section.name}
                  onChange={(e) => updateSection(section.id, { name: e.target.value })}
                />
              </div>
              <button
                className="text-red-500 hover:text-red-700 text-sm"
                onClick={() => removeSection(section.id)}
              >
                Remove
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-3 text-sm">
              <div>
                <label className="text-gray-500">Rows</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  className="w-full p-1 border rounded"
                  value={section.rows}
                  onChange={(e) => updateSection(section.id, { rows: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <label className="text-gray-500">Seats/Row</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="w-full p-1 border rounded"
                  value={section.seatsPerRow}
                  onChange={(e) => updateSection(section.id, { seatsPerRow: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <label className="text-gray-500">Price ×</label>
                <input
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  className="w-full p-1 border rounded"
                  value={section.priceMultiplier}
                  onChange={(e) => updateSection(section.id, { priceMultiplier: parseFloat(e.target.value) || 1 })}
                />
              </div>
              <div>
                <label className="text-gray-500">Color</label>
                <input
                  type="color"
                  className="w-full h-8 border rounded cursor-pointer"
                  value={section.color}
                  onChange={(e) => updateSection(section.id, { color: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview */}
      <div className="mt-6">
        <h4 className="font-medium mb-2">Preview</h4>
        <SeatMap 
          venue={venue}
          basePrice={50}
          readOnly
          showLabels={false}
        />
      </div>
    </div>
  )
}

export default SeatMap
