import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Import data dari public/data.json
    const { products, metadata } = await import('../../../public/data.json')
    
    return NextResponse.json({
      success: true,
      message: 'Products retrieved successfully',
      metadata,
      products
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch products',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    return NextResponse.json({
      success: true,
      message: 'Products endpoint accessed',
      data: body
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Invalid request',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 })
  }
}
