import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

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

export async function GET() {
  try {
    // Read the data file
    const dataPath = path.join(process.cwd(), 'public', 'data.json')
    const fileContents = fs.readFileSync(dataPath, 'utf8')
    const data: ApiResponse = JSON.parse(fileContents)

    if (!data.success || !data.products) {
      return NextResponse.json({
        success: false,
        error: 'Invalid data format'
      }, { status: 400 })
    }

    const products = data.products

    // Comprehensive Analysis
    const analysis = {
      summary: {
        totalProducts: products.length,
        totalCategories: data.metadata.categories.length,
        lastUpdate: data.metadata.lastUpdate,
        lastFetch: data.metadata.lastFetch
      },

      // Category Analysis
      categories: {} as Record<string, {
        count: number
        available: number
        unavailable: number
        avgPrice: number
        minPrice: number
        maxPrice: number
        priceRange: string
        availabilityRate: number
      }>,
      
      // Status Analysis
      status: {
        available: products.filter(p => p.status.available).length,
        unavailable: products.filter(p => !p.status.available).length,
        availabilityRate: 0,
        statusBreakdown: {} as Record<string, number>
      },

      // Price Analysis
      prices: {
        min: Math.min(...products.map(p => p.price)),
        max: Math.max(...products.map(p => p.price)),
        avg: Math.round(products.reduce((sum, p) => sum + p.price, 0) / products.length),
        median: 0,
        ranges: {
          under10k: products.filter(p => p.price < 10000).length,
          between10k50k: products.filter(p => p.price >= 10000 && p.price < 50000).length,
          between50k100k: products.filter(p => p.price >= 50000 && p.price < 100000).length,
          over100k: products.filter(p => p.price >= 100000).length
        }
      },

      // Top Categories by Product Count
      topCategories: [] as Array<{
        category: string
        count: number
        percentage: number
      }>,

      // Price Analysis by Category
      priceByCategory: {} as Record<string, {
        avgPrice: number
        minPrice: number
        maxPrice: number
      }>,

      // Unavailable Products
      unavailableProducts: [] as Array<{
        category: string
        code: string
        description: string
        price: number
        status: string
      }>,

      // Code Pattern Analysis
      codePatterns: {
        byLength: {} as Record<string, number>,
        byPrefix: {} as Record<string, number>
      }
    }

    // Calculate median price
    const sortedPrices = products.map(p => p.price).sort((a, b) => a - b)
    analysis.prices.median = sortedPrices[Math.floor(sortedPrices.length / 2)]

    // Calculate availability rate
    analysis.status.availabilityRate = Math.round((analysis.status.available / analysis.summary.totalProducts) * 100)

    // Analyze each category
    data.metadata.categories.forEach(category => {
      const categoryProducts = products.filter(p => p.category === category)
      const available = categoryProducts.filter(p => p.status.available).length
      const unavailable = categoryProducts.length - available
      const prices = categoryProducts.map(p => p.price)
      
      analysis.categories[category] = {
        count: categoryProducts.length,
        available,
        unavailable,
        avgPrice: Math.round(prices.reduce((sum, p) => sum + p, 0) / prices.length),
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        priceRange: `Rp ${Math.min(...prices).toLocaleString('id-ID')} - Rp ${Math.max(...prices).toLocaleString('id-ID')}`,
        availabilityRate: Math.round((available / categoryProducts.length) * 100)
      }

      // Price by category
      analysis.priceByCategory[category] = {
        avgPrice: analysis.categories[category].avgPrice,
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices)
      }
    })

    // Status breakdown
    products.forEach(p => {
      const statusText = p.status.text || 'unknown'
      analysis.status.statusBreakdown[statusText] = (analysis.status.statusBreakdown[statusText] || 0) + 1
    })

    // Top categories by count
    analysis.topCategories = Object.entries(analysis.categories)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 10)
      .map(([category, data]) => ({
        category,
        count: data.count,
        percentage: Math.round((data.count / analysis.summary.totalProducts) * 100)
      }))

    // Unavailable products
    analysis.unavailableProducts = products
      .filter(p => !p.status.available)
      .map(p => ({
        category: p.category,
        code: p.code,
        description: p.description,
        price: p.price,
        status: p.status.text
      }))

    // Code pattern analysis
    products.forEach(p => {
      const length = p.code.length.toString()
      analysis.codePatterns.byLength[length] = (analysis.codePatterns.byLength[length] || 0) + 1
      
      const prefix = p.code.substring(0, 2)
      analysis.codePatterns.byPrefix[prefix] = (analysis.codePatterns.byPrefix[prefix] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      data: analysis,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to analyze data'
    }, { status: 500 })
  }
}
