'use client'

import { useState, useEffect } from 'react'

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
  const [testMessage, setTestMessage] = useState('')
  const [telegramStatus, setTelegramStatus] = useState<{connected: boolean, message: string}>({ connected: false, message: '' })
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [changes, setChanges] = useState<any>(null)
  const [isLoadingChanges, setIsLoadingChanges] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'name' | 'status'>('price-asc')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 50000 })
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'available' | 'unavailable'>('all')

  const productsPerPage = 20

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/data.json')
      const data: ApiResponse = await response.json()
      
      setProducts(data.products)
      setCategories(data.metadata.categories)
      setTotalProducts(data.products.length)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const detectChanges = async () => {
    setIsLoadingChanges(true)
    try {
      const response = await fetch('/api/changes')
      const result = await response.json()
      
      if (result.success) {
        setChanges(result.data)
      } else {
        console.error('Error detecting changes:', result.error)
      }
    } catch (error) {
      console.error('Error detecting changes:', error)
    } finally {
      setIsLoadingChanges(false)
    }
  }

  const sendChangeNotification = async () => {
    if (!changes?.currentChange?.changes?.length) {
      alert('No changes to send!')
      return
    }

    try {
      const response = await fetch('/api/telegram-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `📊 *Perubahan Terdeteksi*\n\nHarga Naik: ${changes.currentChange.summary.priceChanges.increased}\nHarga Turun: ${changes.currentChange.summary.priceChanges.decreased}\nStatus Buka: ${changes.currentChange.summary.statusChanges.opened}\nStatus Gangguan: ${changes.currentChange.summary.statusChanges.disturbed}\n\nTotal Produk: ${changes.currentChange.summary.totalProducts}`
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        alert('✅ Change notification sent!')
      } else {
        alert(`❌ Error: ${result.error}`)
      }
    } catch (error) {
      alert('Failed to send change notification')
    }
  }

  useEffect(() => {
    fetchProducts()
    checkTelegramStatus()
  }, [])

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

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage)
  const startIndex = (currentPage - 1) * productsPerPage
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage)

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
    setPriceRange({ min: 0, max: 50000 })
    setSortBy('price-asc')
    setCurrentPage(1)
  }

  const exportToCSV = () => {
    const headers = ['Kode', 'Deskripsi', 'Kategori', 'Harga', 'Status']
    const csvData = filteredProducts.map(product => [
      product.code,
      `"${product.description}"`,
      product.category,
      product.price,
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Himalaya Reload Products
          </h1>
          <p className="text-gray-600 mb-6">
            Daftar harga produk terupdate - Total: {totalProducts} produk
          </p>

          {/* Statistics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6 p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm opacity-90">Total Produk</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.available}</div>
              <div className="text-sm opacity-90">Tersedia</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.unavailable}</div>
              <div className="text-sm opacity-90">Gangguan</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">Rp {stats.avgPrice.toLocaleString('id-ID')}</div>
              <div className="text-sm opacity-90">Harga Rata-rata</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.categories}</div>
              <div className="text-sm opacity-90">Kategori</div>
            </div>
          </div>

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
                        setPriceRange(prev => ({ ...prev, max: parseInt(e.target.value) || 50000 }))
                        setCurrentPage(1)
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Telegram Test Section */}
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

              {telegramStatus.message && (
                <div className={`p-3 rounded text-sm ${
                  telegramStatus.connected 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  {telegramStatus.message}
                </div>
              )}

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

          {/* Change Detection Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🔄 Change Detection & Monitoring
            </h2>
            
            <div className="space-y-4">
              <div className="flex gap-2">
                <button
                  onClick={detectChanges}
                  disabled={isLoadingChanges}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isLoadingChanges ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Detecting...</span>
                    </>
                  ) : (
                    <>
                      <span>🔍</span>
                      <span>Detect Changes</span>
                    </>
                  )}
                </button>
                
                {changes?.currentChange?.changes?.length > 0 && (
                  <button
                    onClick={sendChangeNotification}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                  >
                    <span>📢</span>
                    <span>Send Notification</span>
                  </button>
                )}
              </div>

              {changes && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{changes.currentChange?.summary?.priceChanges?.increased || 0}</div>
                      <div className="text-sm text-gray-600">Harga Naik</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{changes.currentChange?.summary?.priceChanges?.decreased || 0}</div>
                      <div className="text-sm text-gray-600">Harga Turun</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{changes.currentChange?.summary?.statusChanges?.opened || 0}</div>
                      <div className="text-sm text-gray-600">Status Buka</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{changes.currentChange?.summary?.statusChanges?.disturbed || 0}</div>
                      <div className="text-sm text-gray-600">Status Gangguan</div>
                    </div>
                  </div>

                  {changes.currentChange?.changes?.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Changes:</h3>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {changes.currentChange.changes.slice(0, 5).map((change: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                            <div className="flex-1">
                              <span className="font-medium">{change.description}</span>
                              <span className="text-gray-500 ml-2">({change.code})</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {change.priceChange === 'increase' && <span className="text-green-600">📈</span>}
                              {change.priceChange === 'decrease' && <span className="text-red-600">📉</span>}
                              {change.statusChange === 'open' && <span className="text-blue-600">✅</span>}
                              {change.statusChange === 'gangguan' && <span className="text-orange-600">⚠️</span>}
                            </div>
                          </div>
                        ))}
                        {changes.currentChange.changes.length > 5 && (
                          <div className="text-sm text-gray-500 text-center">
                            ... and {changes.currentChange.changes.length - 5} more changes
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 text-center">
                    Last checked: {new Date(changes.currentChange?.timestamp || Date.now()).toLocaleString('id-ID')}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading products...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {paginatedProducts.map((product) => (
                <div
                  key={`${product.category}-${product.code}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {product.description}
                      </h3>
                      <p className="text-sm text-gray-600">
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

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Kategori:</span>
                      <span className="text-sm font-medium">{product.category}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Harga:</span>
                      <span className="text-lg font-bold text-green-600">
                        Rp {product.price.toLocaleString('id-ID')}
                      </span>
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
                  className="px-3 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
