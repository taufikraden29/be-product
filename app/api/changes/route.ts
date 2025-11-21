import { NextRequest, NextResponse } from 'next/server'
import { scraperService } from '@/lib/scraper'
import { changeDetector } from '@/lib/change-detector'

export async function GET() {
  try {
    // Get latest data
    const fetchResult = await scraperService.fetchData()
    const currentProducts = fetchResult.data

    // Detect changes
    const changeLog = changeDetector.detectChanges(currentProducts)

    // Get recent changes for context
    const recentChanges = changeDetector.getRecentChanges(24)

    return NextResponse.json({
      success: true,
      data: {
        currentChange: changeLog,
        recentChanges: recentChanges,
        hasSignificantChanges: changeDetector.hasSignificantChanges(changeLog),
        summary: {
          totalProducts: currentProducts.length,
          lastUpdated: fetchResult.lastUpdate,
          changeCount: changeLog.changes.length
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error detecting changes:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to detect changes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'clear-history':
        changeDetector.clearHistory()
        return NextResponse.json({
          success: true,
          message: 'Change history cleared',
          timestamp: new Date().toISOString()
        })

      case 'force-detect':
        const fetchResult = await scraperService.fetchData()
        const currentProducts = fetchResult.data
        const changeLog = changeDetector.detectChanges(currentProducts)
        
        return NextResponse.json({
          success: true,
          message: 'Change detection forced',
          data: changeLog,
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
            availableActions: ['clear-history', 'force-detect']
          },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Error in changes POST:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Invalid request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    )
  }
}
