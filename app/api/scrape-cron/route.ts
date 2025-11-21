import { NextRequest, NextResponse } from 'next/server'
import { scraperService } from '@/lib/scraper'
import fs from 'fs'
import path from 'path'

/**
 * This endpoint is designed to be triggered by external cron services
 * like cron-job.org, Railway Cron, or similar services
 * 
 * Setup Instructions:
 * 1. Use cron-job.org or similar service
 * 2. Set URL: https://your-domain.com/api/scrape-cron
 * 3. Set interval: Every 1 minute
 * 4. Method: POST
 * 5. Add Authorization header (optional but recommended)
 */

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authorization check for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
        message: 'Invalid or missing authorization token'
      }, { status: 401 })
    }

    console.log('⏰ Cron job triggered - Starting data scraping...')
    
    // Fetch latest data from source
    const result = await scraperService.fetchData()
    
    if (!result.data) {
      return NextResponse.json({
        success: false,
        error: 'No data fetched',
        message: 'Failed to scrape data from source'
      }, { status: 500 })
    }

    // Get all categories
    const categories = Array.from(new Set(result.data.map(p => p.category)))
    
    // Prepare data structure for saving
    const dataToSave = {
      success: true,
      message: 'Data fetched successfully',
      metadata: {
        lastUpdate: result.lastUpdate || new Date().toISOString(),
        lastFetch: result.lastFetch || new Date().toISOString(),
        totalProducts: result.data.length,
        categories: categories
      },
      products: result.data
    }

    // Save to public/data.json for frontend consumption
    const dataPath = path.join(process.cwd(), 'public', 'data.json')
    fs.writeFileSync(dataPath, JSON.stringify(dataToSave, null, 2), 'utf8')
    
    console.log(`✅ Data saved successfully: ${result.data.length} products, ${categories.length} categories`)
    console.log(`📝 Data updated: ${result.updated ? 'YES' : 'NO'}`)

    return NextResponse.json({
      success: true,
      message: 'Scraping completed and data saved',
      data: {
        updated: result.updated,
        totalProducts: result.data.length,
        totalCategories: categories.length,
        lastUpdate: result.lastUpdate,
        lastFetch: result.lastFetch,
        fileSaved: 'public/data.json'
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Cron scraping error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Scraping failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Allow GET for manual testing
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({
      success: true,
      message: 'Cron endpoint is active',
      instructions: {
        method: 'POST',
        url: `${request.nextUrl.origin}/api/scrape-cron`,
        interval: 'Every 1 minute',
        headers: cronSecret ? {
          'Authorization': 'Bearer YOUR_CRON_SECRET'
        } : undefined,
        services: [
          'cron-job.org - Free external cron service',
          'Railway Cron - Built-in Railway feature',
          'GitHub Actions - Using schedule trigger',
          'Vercel Cron - Using vercel.json configuration'
        ]
      },
      note: 'Send POST request to trigger scraping'
    })
  }

  // Allow authorized GET to trigger scraping (for testing)
  return POST(request)
}
