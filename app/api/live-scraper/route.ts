import { NextRequest, NextResponse } from 'next/server'
import { scraperService } from '@/lib/scraper'

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Starting live scraping from Himalaya Reload...')
    
    // Fetch live data
    const result = await scraperService.fetchData()
    
    if (result.data) {
      // Calculate additional statistics
      const products = result.data
      const stats = {
        total: products.length,
        available: products.filter(p => p.status.available).length,
        unavailable: products.filter(p => !p.status.available).length,
        categories: Array.from(new Set(products.map(p => p.category))).length,
        avgPrice: products.length > 0 ? Math.round(products.reduce((sum, p) => sum + p.price, 0) / products.length) : 0,
        priceRange: {
          min: products.length > 0 ? Math.min(...products.map(p => p.price)) : 0,
          max: products.length > 0 ? Math.max(...products.map(p => p.price)) : 0
        },
        lastUpdated: result.lastUpdate,
        dataUpdated: result.updated
      }

      // Group by category
      const byCategory = products.reduce((acc, product) => {
        if (!acc[product.category]) {
          acc[product.category] = []
        }
        acc[product.category].push(product)
        return acc
      }, {} as Record<string, typeof products>)

      return NextResponse.json({
        success: true,
        message: 'Live data fetched successfully',
        data: {
          products,
          stats,
          byCategory,
          metadata: {
            lastUpdate: result.lastUpdate,
            lastFetch: result.lastFetch,
            updated: result.updated,
            categories: Object.keys(byCategory),
            totalProducts: products.length
          }
        },
        timestamp: new Date().toISOString()
      })

    } else {
      return NextResponse.json({
        success: false,
        error: 'No data available',
        message: 'Failed to fetch data from source',
        timestamp: new Date().toISOString()
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Live scraping error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to scrape data',
      details: error instanceof Error ? error.message : 'Unknown error',
      message: 'An error occurred while fetching live data from the website',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'force-refresh':
        console.log('🔄 Force refresh requested')
        const result = await scraperService.fetchData()
        
        return NextResponse.json({
          success: true,
          message: 'Force refresh completed',
          data: {
            products: result.data,
            updated: result.updated,
            lastUpdate: result.lastUpdate,
            lastFetch: result.lastFetch
          },
          timestamp: new Date().toISOString()
        })

      case 'check-cache':
        const cacheInfo = scraperService.getCacheInfo()
        
        return NextResponse.json({
          success: true,
          message: 'Cache information retrieved',
          data: cacheInfo,
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          availableActions: ['force-refresh', 'check-cache'],
          timestamp: new Date().toISOString()
        }, { status: 400 })
    }

  } catch (error) {
    console.error('❌ POST error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Invalid request',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 400 })
  }
}
