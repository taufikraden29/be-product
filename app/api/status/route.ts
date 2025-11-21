import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const status = {
      success: true,
      message: 'Himalaya Reload API Status: Operational',
      timestamp: new Date().toISOString(),
      services: {
        scraper: 'operational',
        telegram: 'operational',
        database: 'operational'
      },
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
    
    return NextResponse.json(status)
  } catch (error) {
    console.error('Error checking status:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Status check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    return NextResponse.json({
      success: true,
      message: 'Status endpoint accessed',
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
