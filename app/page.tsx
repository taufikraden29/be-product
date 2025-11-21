'use client'

import { useState, useEffect } from 'react'
import Navigation from '../components/Navigation'
import { formatToRupiah, formatToCompactRupiah, getPriceColorClass, getPriceRangeDescription } from '../utils/clientCurrency'
import { useAutoRefresh } from '../hooks/useAutoRefresh'

interface Product {
  category: string
  code: string
  description: string
  price: number
  status: {
    text: string
    available: boolean
    status: string
  }
}

interface ApiResponse {
  success: boolean
  message: string
  metadata: {
    lastUpdate: string
    lastFetch: string
    totalProducts: number
    categories: string[]
  }
  products: Product[]
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [testMessage, setTestMessage] = useState('')
  const [telegramStatus, setTelegramStatus] = useState<{connected: boolean, message: string}>({ connected: false, message: '' })
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [changes, setChanges] = useState<any>(null)
  const [isLoadingChanges, setIsLoadingChanges] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'name' | 'status'>('price-asc')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000000 })
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'available' | 'unavailable'>('all')
  const [liveData, setLiveData] = useState<any>(null)
  const [isLoadingLive, setIsLoadingLive] = useState(false)
  const [liveDataEnabled, setLiveDataEnabled] = useState(false)
  const [cacheInfo, setCacheInfo] = useState<any>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false)
  const [changeLogs, setChangeLogs] = useState<any>(null)
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [logsSummary, setLogsSummary] = useState<any>(null)
  const [currentSection, setCurrentSection] = useState('products')

  const productsPerPage = 20

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/data.json?t=' + Date.now()) // Cache busting
      const data: ApiResponse = await response.json()
      
      setProducts(data.products)
      setCategories(data.metadata.categories)
      setTotalProducts(data.products.length)
      setLastUpdate(data.metadata.lastUpdate)
      
      console.log('📊 Products loaded:', {
        total: data.products.length,
        categories: data.metadata.categories.length,
        lastUpdate: data.metadata.lastUpdate
      })
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  // Setup auto-refresh every 1 minute
  const autoRefresh = useAutoRefresh(fetchProducts, {
    interval: 60000, // 1 minute
    enabled: true,
    onRefresh: () => {
      console.log('✅ Products refreshed automatically')
    }
  })

  useEffect(() => {
    checkTelegramStatus()
  }, [])

  const checkTelegramStatus = async () => {
    try {
      const response = await fetch('/api/telegram-test')
      const result = await response.json()
      
      setTelegramStatus({
        connected: result.config?.hasBotToken && result.config?.hasChatId,
        message: result.message
      })
    } catch (error) {
      setTelegramStatus({
        connected: false,
        message: 'Failed to check Telegram status'
      })
    }
  }

  const sendTelegramTest = async () => {
    if (!testMessage.trim()) {
      setTelegramStatus({
        connected: false,
        message: 'Please enter a test message'
      })
      return
    }

    setIsSendingTest(true)
    try {
      const response = await fetch('/api/telegram-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testMessage
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setTelegramStatus({
          connected: true,
          message: `✅ Test notification sent successfully! Message ID: ${result.details?.messageId}`
        })
        setTestMessage('')
      } else {
        setTelegramStatus({
          connected: false,
          message: `❌ Error: ${result.error} - ${result.details}`
        })
      }
    } catch (error) {
      setTelegramStatus({
        connected: false,
        message: 'Failed to send test notification'
      })
    } finally {
      setIsSendingTest(false)
    }
  }

  const fetchAnalysis = async () => {
    setIsLoadingAnalysis(true)
    try {
      const response = await fetch('/api/analysis')
      const result = await response.json()
      
      if (result.success) {
        setAnalysis(result.data)
      } else {
        console.error('Error fetching analysis:', result.error)
      }
    } catch (error) {
      console.error('Error fetching analysis:', error)
    } finally {
      setIsLoadingAnalysis(false)
    }
  }

  const fetchChangeLogs = async (includeFile = false, onlySignificant = true) => {
    setIsLoadingLogs(true)
    try {
      const params = new URLSearchParams({
        limit: '20',
        includeFile: includeFile.toString(),
        onlySignificant: onlySignificant.toString()
      })
      
      const response = await fetch(`/api/change-logs?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setChangeLogs(result.data)
      } else {
        console.error('Error fetching change logs:', result.error)
      }
    } catch (error) {
      console.error('Error fetching change logs:', error)
    } finally {
      setIsLoadingLogs(false)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || product.category === selectedCategory
    const matchesPrice = product.price >= priceRange.min && product.price <= priceRange.max
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'available' && product.status.available) ||
      (selectedStatus === 'unavailable' && !product.status.available)
    
    return matchesSearch && matchesCategory && matchesPrice && matchesStatus
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.price - b.price
      case 'price-desc':
        return b.price - a.price
      case 'name':
        return a.description.localeCompare(b.description)
      case 'status':
        return (a.status.available ? 0 : 1) - (b.status.available ? 0 : 1)
      default:
        return 0
    }
  })

  // Group products by category
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = []
    }
    acc[product.category].push(product)
    return acc
  }, {} as Record<string, typeof filteredProducts>)

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)

  // Statistics
  const stats = {
    total: products.length,
    available: products.filter(p => p.status.available).length,
    unavailable: products.filter(p => !p.status.available).length,
    avgPrice: products.length > 0 ? Math.round(products.reduce((sum, p) => sum + p.price, 0) / products.length) : 0,
    categories: categories.length
  }

  const resetFilters = () => {
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedStatus('all')
    setPriceRange({ min: 0, max: 1000000 })
    setSortBy('price-asc')
    setCurrentPage(1)
  }

  const exportToCSV = () => {
    const headers = ['Kode', 'Deskripsi', 'Kategori', 'Harga', 'Status']
    const csvData = filteredProducts.map(product => [
      product.code,
      `"${product.description}"`,
      product.category,
      formatToRupiah(product.price),
      product.status.text
    ])
    
    const csv = [headers.join(','), ...csvData.map(row => row.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `himalaya_products_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Render different sections based on current selection
  const renderSection = () => {
    switch (currentSection) {
      case 'products':
        return renderProductsSection()
      case 'analysis':
        return renderAnalysisSection()
      case 'live-scraper':
        return renderLiveScraperSection()
      case 'change-logs':
        return renderChangeLogsSection()
      case 'telegram':
        return renderTelegramSection()
      case 'settings':
        return renderSettingsSection()
      default:
        return renderProductsSection()
    }
  }

  const renderProductsSection = () => (
    <>
      {/* Advanced Filters Toggle */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <span>🔍</span>
          <span>{showAdvancedFilters ? 'Sembunyikan Filter' : 'Tampilkan Filter Lanjutan'}</span>
        </button>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={resetFilters}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            🔄 Reset
          </button>
          <button
            onClick={exportToCSV}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Basic Search & Category */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Cari produk..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setCurrentPage(1)
          }}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value)
            setCurrentPage(1)
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Semua Kategori</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Urutkan berdasarkan</label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="price-asc">Harga (Rendah ke Tinggi)</option>
                <option value="price-desc">Harga (Tinggi ke Rendah)</option>
                <option value="name">Nama (A-Z)</option>
                <option value="status">Status</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status Produk</label>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value as any)
                  setCurrentPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua Status</option>
                <option value="available">Tersedia</option>
                <option value="unavailable">Gangguan</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rentang Harga</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => {
                    setPriceRange(prev => ({ ...prev, min: parseInt(e.target.value) || 0 }))
                    setCurrentPage(1)
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => {
                    setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) || 1000000 }))
                    setCurrentPage(1)
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading products...</p>
        </div>
      ) : (
        <>
          {/* Category Cards */}
          <div className="space-y-8 mb-8">
            {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
              <div key={category} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">{category}</h2>
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                      {categoryProducts.length} Produk
                    </span>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryProducts.map((product) => (
                      <div
                        key={`${product.category}-${product.code}`}
                        className="bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors p-4 border border-gray-200"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">
                              {product.description}
                            </h3>
                            <p className="text-xs text-gray-600">
                              Kode: {product.code}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              product.status.available
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {product.status.text}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Harga:</span>
                          <div className="text-right">
                            <span className={`text-lg font-bold ${getPriceColorClass(product.price)}`}>
                              {formatToRupiah(product.price)}
                            </span>
                            <div className="text-xs text-gray-500">
                              {getPriceRangeDescription(product.price)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </>
  )

  const renderAnalysisSection = () => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        📊 Data Analysis
      </h2>
      
      <div className="space-y-4">
        <button
          onClick={fetchAnalysis}
          disabled={isLoadingAnalysis}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isLoadingAnalysis ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <span>📈</span>
              <span>Analyze Data</span>
            </>
          )}
        </button>

        {analysis && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{analysis.summary.totalProducts}</div>
                <div className="text-sm text-gray-600">Total Produk</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{analysis.summary.totalCategories}</div>
                <div className="text-sm text-gray-600">Total Kategori</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{analysis.status.availabilityRate}%</div>
                <div className="text-sm text-gray-600">Ketersediaan</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{formatToRupiah(analysis.prices.avg)}</div>
                <div className="text-sm text-gray-600">Harga Rata-rata</div>
              </div>
            </div>

            {/* Price Analysis */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">💰 Analisis Harga</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{formatToRupiah(analysis.prices.min)}</div>
                  <div className="text-sm text-gray-600">Harga Minimum</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-lg font-bold text-red-600">{formatToRupiah(analysis.prices.max)}</div>
                  <div className="text-sm text-gray-600">Harga Maksimum</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">{formatToRupiah(analysis.prices.median)}</div>
                  <div className="text-sm text-gray-600">Harga Median</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-lg font-bold text-purple-600">{formatToRupiah(analysis.prices.avg)}</div>
                  <div className="text-sm text-gray-600">Harga Rata-rata</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderLiveScraperSection = () => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        🌐 Live Data Scraper
      </h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${liveDataEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            <span className="text-sm font-medium">
              {liveDataEnabled ? '✅ Live Data Active' : '⚪ Using Sample Data'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderChangeLogsSection = () => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        📋 Change History & Logs
      </h2>
      
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => fetchChangeLogs(false, true)}
            disabled={isLoadingLogs}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoadingLogs ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <span>📋</span>
                <span>Load Change Logs</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )

  const renderTelegramSection = () => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        📱 Telegram Test Notification
      </h2>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <span className={`w-3 h-3 rounded-full ${telegramStatus.connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-sm font-medium">
            {telegramStatus.connected ? '✅ Connected' : '❌ Not Connected'}
          </span>
          <button
            onClick={checkTelegramStatus}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Refresh Status
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter test message..."
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendTelegramTest()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={sendTelegramTest}
            disabled={isSendingTest || !testMessage.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSendingTest ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Sending...</span>
              </>
            ) : (
              <>
                <span>📤</span>
                <span>Send Test</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )

  const renderSettingsSection = () => (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        ⚙️ Pengaturan Aplikasi
      </h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">🔧 General Settings</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Default currency format</span>
              <span className="text-green-600 font-medium">Indonesian Rupiah (IDR)</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3">🎨 Display Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              🔄 Reset All Filters
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              📥 Export Current Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Himalaya Reload Products
              </h1>
              <p className="text-gray-600 mb-2">
                Daftar harga produk terupdate - Total: {totalProducts} produk
              </p>
              {lastUpdate && (
                <p className="text-sm text-gray-500">
                  Last update: {new Date(lastUpdate).toLocaleString('id-ID')}
                </p>
              )}
            </div>
            
            {/* Auto-Refresh Indicator */}
            <div className="bg-white rounded-lg shadow-sm p-4 min-w-[240px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Auto-Refresh</span>
                <div className={`w-2 h-2 rounded-full ${autoRefresh.isEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              </div>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-medium">{autoRefresh.isEnabled ? '✅ Active' : '⏸️ Paused'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Next in:</span>
                  <span className="font-medium">{autoRefresh.secondsUntilRefresh}s</span>
                </div>
                <div className="flex justify-between">
                  <span>Interval:</span>
                  <span className="font-medium">60s</span>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => autoRefresh.setEnabled(!autoRefresh.isEnabled)}
                  className={`flex-1 px-3 py-1 text-xs rounded ${
                    autoRefresh.isEnabled 
                      ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {autoRefresh.isEnabled ? 'Pause' : 'Resume'}
                </button>
                <button
                  onClick={autoRefresh.forceRefresh}
                  className="flex-1 px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
                >
                  Refresh Now
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <Navigation 
          currentSection={currentSection}
          onSectionChange={setCurrentSection}
          stats={stats}
        />

        {/* Render Current Section */}
        {renderSection()}
      </div>
    </div>
  )
}