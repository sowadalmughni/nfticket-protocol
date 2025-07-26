/**
 * NFTicket Dashboard
 * Web3 admin dashboard for managing NFT tickets and POAP distribution
 * @author Sowad Al-Mughni
 */

import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Dashboard } from './pages/Dashboard'
import { Events } from './pages/Events'
import { Tickets } from './pages/Tickets'
import { POAPs } from './pages/POAPs'
import { Analytics } from './pages/Analytics'
import { Settings } from './pages/Settings'
import './App.css'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">NFTicket Protocol Dashboard</h1>
              <p className="mt-2 text-gray-600">Manage your NFT tickets and POAP distribution</p>
            </div>
            
            <nav className="mb-8">
              <div className="flex space-x-8">
                <a href="/" className="text-blue-600 hover:text-blue-800 font-medium">Dashboard</a>
                <a href="/events" className="text-gray-600 hover:text-gray-800">Events</a>
                <a href="/tickets" className="text-gray-600 hover:text-gray-800">Tickets</a>
                <a href="/poaps" className="text-gray-600 hover:text-gray-800">POAPs</a>
                <a href="/analytics" className="text-gray-600 hover:text-gray-800">Analytics</a>
                <a href="/settings" className="text-gray-600 hover:text-gray-800">Settings</a>
              </div>
            </nav>
            
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/events" element={<Events />} />
              <Route path="/tickets" element={<Tickets />} />
              <Route path="/poaps" element={<POAPs />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  )
}

export default App

