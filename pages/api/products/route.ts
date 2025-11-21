import { NextRequest, NextResponse } from 'next/server'
import { scraperService } from '@/lib/scraper'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    // Get cached data
    const cachedData = scraperService.getCachedData()

    if (!cachedData) {
      return NextResponse.json(
        {
          success: false,
          error: 'No data available',
          message: 'Please try again in a moment while we fetch the latest data'
        },
        { status: 404 }
      )
    }

    let filteredProducts = cachedData.data

    // Filter by category
    if (category) {
      filteredProducts = filteredProducts.filter((product: any) =>
        product.category.toLowerCase().includes(category.toLowerCase())
      )
    }

    // Search by code or description
    if (search) {
      const searchQuery = search.toLowerCase()
      filteredProducts = filteredProducts.filter((product: any) =>
        product.code.toLowerCase().includes(searchQuery) ||
        product.description.toLowerCase().includes(searchQuery)
      )
    }

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex)
    const totalPages = Math.ceil(filteredProducts.length / limit)

    return NextResponse.json({
      success: true,
      data: paginatedProducts,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: filteredProducts.length,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      metadata: {
        lastUpdate: cachedData.lastUpdate,
        lastFetch: cachedData.lastFetch,
        totalProducts: filteredProducts.length
      }
    })

  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch products'
      },
      { status: 500 }
    )
  }
}
