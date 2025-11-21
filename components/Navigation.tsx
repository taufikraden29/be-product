'use client'

import React, { useState } from 'react'

interface NavigationProps {
  currentSection: string
  onSectionChange: (section: string) => void
  stats?: {
    total: number
    available: number
    unavailable: number
    categories: number
  }
}

const Navigation: React.FC<NavigationProps> = ({ currentSection, onSectionChange, stats }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const sections = [
    {
      id: 'products',
      title: 'Produk',
      icon: '🛍️',
      description: 'Daftar semua produk',
      color: 'blue'
    },
    {
      id: 'analysis',
      title: 'Analisis Data',
      icon: '📊',
      description: 'Statistik dan analisis',
      color: 'indigo'
    },
    {
      id: 'live-scraper',
      title: 'Live Scraper',
      icon: '🌐',
      description: 'Data real-time',
      color: 'green'
    },
    {
      id: 'change-logs',
      title: 'Change Logs',
      icon: '📋',
      description: 'History perubahan',
      color: 'purple'
    },
    {
      id: 'telegram',
      title: 'Telegram',
      icon: '📱',
      description: 'Test notifikasi',
      color: 'blue'
    },
    {
      id: 'settings',
      title: 'Pengaturan',
      icon: '⚙️',
      description: 'Konfigurasi aplikasi',
      color: 'gray'
    }
  ]

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors: Record<string, { bg: string, text: string, activeBg: string, activeText: string }> = {
      blue: {
        bg: 'bg-blue-50 hover:bg-blue-100',
        text: 'text-blue-700',
        activeBg: 'bg-blue-600',
        activeText: 'text-white'
      },
      indigo: {
        bg: 'bg-indigo-50 hover:bg-indigo-100',
        text: 'text-indigo-700',
        activeBg: 'bg-indigo-600',
        activeText: 'text-white'
      },
      green: {
        bg: 'bg-green-50 hover:bg-green-100',
        text: 'text-green-700',
        activeBg: 'bg-green-600',
        activeText: 'text-white'
      },
      purple: {
        bg: 'bg-purple-50 hover:bg-purple-100',
        text: 'text-purple-700',
        activeBg: 'bg-purple-600',
        activeText: 'text-white'
      },
      gray: {
        bg: 'bg-gray-50 hover:bg-gray-100',
        text: 'text-gray-700',
        activeBg: 'bg-gray-600',
        activeText: 'text-white'
      }
    }

    const colorClass = colors[color] || colors.gray
    
    if (isActive) {
      return `${colorClass.activeBg} ${colorClass.activeText} shadow-lg transform scale-105`
    }
    
    return `${colorClass.bg} ${colorClass.text} hover:shadow-md transition-all duration-200`
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-full flex items-center justify-between p-4 bg-white rounded-lg shadow-md border border-gray-200"
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">
              {sections.find(s => s.id === currentSection)?.icon || '🛍️'}
            </span>
            <div>
              <div className="font-semibold text-gray-900">
                {sections.find(s => s.id === currentSection)?.title || 'Navigation'}
              </div>
              <div className="text-sm text-gray-600">
                {sections.find(s => s.id === currentSection)?.description}
              </div>
            </div>
          </div>
          <span className={`transform transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-180' : ''}`}>
            ⬇️
          </span>
        </button>
      </div>

      {/* Navigation Grid */}
      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} lg:block mb-8`}>
        {/* Stats Summary */}
        {stats && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">
            <h3 className="text-lg font-semibold mb-3">📈 Ringkasan Data</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{stats.total.toLocaleString('id-ID')}</div>
                <div className="text-sm opacity-90">Total Produk</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-300">{stats.available.toLocaleString('id-ID')}</div>
                <div className="text-sm opacity-90">Tersedia</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-300">{stats.unavailable.toLocaleString('id-ID')}</div>
                <div className="text-sm opacity-90">Gangguan</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-300">{stats.categories}</div>
                <div className="text-sm opacity-90">Kategori</div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((section) => {
            const isActive = currentSection === section.id
            
            return (
              <button
                key={section.id}
                onClick={() => {
                  onSectionChange(section.id)
                  setIsMobileMenuOpen(false)
                }}
                className={`p-4 rounded-lg border border-gray-200 text-left transition-all duration-200 ${getColorClasses(section.color, isActive)}`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl flex-shrink-0">{section.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{section.title}</h3>
                    <p className={`text-sm ${isActive ? 'text-white/90' : 'text-gray-600'}`}>
                      {section.description}
                    </p>
                  </div>
                  {isActive && (
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-white/20 rounded-full">
                        ✓
                      </span>
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">🚀 Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onSectionChange('live-scraper')}
              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
            >
              🔄 Refresh Data
            </button>
            <button
              onClick={() => onSectionChange('change-logs')}
              className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
            >
              📋 View Changes
            </button>
            <button
              onClick={() => onSectionChange('telegram')}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            >
              📱 Test Telegram
            </button>
            <button
              onClick={() => onSectionChange('analysis')}
              className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200 transition-colors"
            >
              📊 Analytics
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Navigation