/**
 * Component Barrel Export
 * Central export for all dashboard components
 */

// Layout components
export { default as Header } from './Header'
export { default as Sidebar } from './Sidebar'

// Feature components
export { SeatingChart, SeatSelectionSummary, useSeatSelection } from './SeatingChart'
export { default as SeatMap } from './SeatMap'

// Re-export UI components
export * from './ui'
