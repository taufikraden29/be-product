import { NextResponse } from 'next/server'
import { scraperService } from '@/lib/scraper'

export async function GET() {
  try {
    const cacheInfo = scraperService.getCacheInfo()
    
    return NextResponse.json({
      success: true,
      data: {
        cache: cacheInfo,
        timestamp: new Date().toISOString(),
        status: 'running'
      }
    })

  } catch (error) {
    console.error('Error fetching status:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to fetch status'
      },
      { status: 500 }
    )
  }
}
