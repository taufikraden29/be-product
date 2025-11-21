import axios from 'axios'
import * as cheerio from 'cheerio'
import crypto from 'crypto'

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

interface CacheData {
  data: Product[]
  lastUpdate: string | null
  lastFetch: string | null
}

class ScraperService {
  private cache: {
    data: Product[] | null
    hash: string | null
    lastUpdate: string | null
    lastFetch: string | null
  }

  private targetUrl: string

  constructor() {
    this.targetUrl = process.env.SCRAPER_URL || 'https://himalayareload.otoreport.com/harga.js.php?id=b61804374cb7e3d207028ac05b492f82265047801111a2c0bc3bb288a7a843341b24cdc21347fbc9ba602392b435df468647-6'
    this.cache = {
      data: null,
      hash: null,
      lastUpdate: null,
      lastFetch: null
    }

    // Initialize with sample data for development
    this.initializeSampleData()
  }

  async fetchData(): Promise<{ data: Product[]; updated: boolean; lastUpdate: string | null; lastFetch: string | null }> {
    try {
      console.log('🔄 Fetching data from Himalaya Reload...')
      
      const response = await axios.get(this.targetUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      const html = response.data
      const hash = this.generateHash(html)

      // Check if Data has changed
      if (this.cache.hash === hash && this.cache.data) {
        console.log('✅ Data has not changed, using cached data')
        this.cache.lastFetch = new Date().toISOString()
        return {
          data: this.cache.data,
          updated: false,
          lastUpdate: this.cache.lastUpdate,
          lastFetch: this.cache.lastFetch
        }
      }

      // Parse and extract data
      const parsedData = this.parseHtml(html)
      
      // Update cache
      this.cache = {
        data: parsedData,
        hash: hash,
        lastUpdate: new Date().toISOString(),
        lastFetch: new Date().toISOString()
      }

      console.log(`✅ Data updated successfully. Found ${parsedData.length} product categories`)

      return {
        data: parsedData,
        updated: true,
        lastUpdate: this.cache.lastUpdate,
        lastFetch: this.cache.lastFetch
      }

    } catch (error) {
      console.error('❌ Error fetching data:', error)

      // Return cached data if available, even if stale
      if (this.cache.data) {
        console.warn('⚠️ Returning stale cached data due to fetch error')
        return {
          data: this.cache.data,
          updated: false,
          lastUpdate: this.cache.lastUpdate,
          lastFetch: this.cache.lastFetch
        }
      }

      throw new Error(`Failed to fetch data: ${error}`)
    }
  }

  private parseHtml(html: string): Product[] {
    const $ = cheerio.load(html)
    const products: Product[] = []

    // Try multiple selectors to find product data
    const tables = $('table')
    console.log(`Found ${tables.length} tables on the page`)

    tables.each((tableIndex: number, table: any) => {
      const $table = $(table)
      
      // Look for category header
      let categoryName = ''
      const headerRow = $table.find('tr').first()
      if (headerRow.length > 0) {
        const headerText = headerRow.find('td').first().text().trim()
        if (headerText && headerText.toLowerCase() !== 'no') {
          categoryName = headerText.split(' ')[0] || headerText
        }
      }

      // If no category found in header, try to extract from URL or use default
      if (!categoryName || categoryName.toLowerCase() === 'no') {
        categoryName = this.getCategoryFromContext($table)
      }
      
      if (!categoryName) {
        categoryName = 'OTHER'
      }

      console.log(`Processing category: ${categoryName}`)

      // Find all product rows (skip header rows)
      const productRows = $table.find('tr').slice(1)
      
      productRows.each((rowIndex: number, row: any) => {
        const $row = $(row)
        const $cells = $row.find('td')

        if ($cells.length >= 3) {
          // Try different cell configurations
          let code = ''
          let description = ''
          let priceText = ''
          let statusText = ''

          // Configuration 1: Code | Description | Price | Status
          if ($cells.length >= 4) {
            code = $cells.eq(0).text().trim()
            description = $cells.eq(1).text().trim()
            priceText = $cells.eq(2).text().trim()
            statusText = $cells.eq(3).text().trim()
          } 
          // Configuration 2: Code | Description | Status | Price
          else if ($cells.length >= 4) {
            code = $cells.eq(0).text().trim()
            description = $cells.eq(1).text().trim()
            statusText = $cells.eq(2).text().trim()
            priceText = $cells.eq(3).text().trim()
          }
          // Configuration 3: Code | Price | Description | Status
          else if ($cells.length >= 4) {
            code = $cells.eq(0).text().trim()
            priceText = $cells.eq(1).text().trim()
            description = $cells.eq(2).text().trim()
            statusText = $cells.eq(3).text().trim()
          }

          const price = this.parsePrice(priceText)
          const status = this.parseStatus(statusText)

          // Validate product data
          if (code && description && price > 0) {
            const product: Product = {
              category: categoryName.toUpperCase(),
              code,
              description,
              price,
              status
            }

            // Only add valid products
            if (this.isValidProduct(product)) {
              products.push(product)
            }
          }
        }
      })
    })

    // Remove duplicates based on code
    const uniqueProducts = this.removeDuplicates(products)
    
    console.log(`✅ Successfully parsed ${uniqueProducts.length} unique products`)
    return uniqueProducts
  }

  private getCategoryFromContext($table: any): string {
    // Try to find category from nearby elements or table structure
    const prevElement = $table.prev()
    const nextElement = $table.next()
    
    if (prevElement.length > 0) {
      const prevText = prevElement.text().toLowerCase()
      if (prevText.includes('telkomsel')) return 'TELKOMSEL'
      if (prevText.includes('indosat')) return 'INDOSAT OOREDOO'
      if (prevText.includes('xl')) return 'XL'
      if (prevText.includes('axis')) return 'AXIS'
    }
    
    if (nextElement.length > 0) {
      const nextText = nextElement.text().toLowerCase()
      if (nextText.includes('telkomsel')) return 'TELKOMSEL'
      if (nextText.includes('indosat')) return 'INDOSAT OOREDOO'
      if (nextText.includes('xl')) return 'XL'
      if (nextText.includes('axis')) return 'AXIS'
    }

    // Try to extract from table class or id
    const tableClass = $table.attr('class') || ''
    const tableId = $table.attr('id') || ''
    
    if (tableClass.toLowerCase().includes('telkomsel')) return 'TELKOMSEL'
    if (tableClass.toLowerCase().includes('indosat')) return 'INDOSAT OOREDOO'
    if (tableClass.toLowerCase().includes('xl')) return 'XL'
    if (tableClass.toLowerCase().includes('axis')) return 'AXIS'
    
    if (tableId.toLowerCase().includes('telkomsel')) return 'TELKOMSEL'
    if (tableId.toLowerCase().includes('indosat')) return 'INDOSAT OOREDOO'
    if (tableId.toLowerCase().includes('xl')) return 'XL'
    if (tableId.toLowerCase().includes('axis')) return 'AXIS'

    return 'OTHER'
  }

  private isValidProduct(product: Product): boolean {
    // Basic validation
    return (
      product.code.length > 0 &&
      product.description.length > 0 &&
      product.price > 0 &&
      product.price < 1000000 && // Sanity check for price
      product.category.length > 0
    )
  }

  private removeDuplicates(products: Product[]): Product[] {
    const seen = new Set<string>()
    return products.filter(product => {
      const key = `${product.category}-${product.code}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  private parsePrice(priceText: string): number {
    // Indonesian format: 10.000 (dot for thousands), 10.000,50 (comma for decimals)
    // Remove 'Rp' and other currency symbols
    let cleanPrice = priceText
      .replace(/Rp\.?\s?/gi, '')
      .trim()
    
    // Check if has comma (Indonesian decimal separator)
    if (cleanPrice.includes(',')) {
      // Format: 10.000,50 -> remove dots (thousands) and convert comma to dot (decimal)
      cleanPrice = cleanPrice
        .replace(/\./g, '') // Remove thousand separators
        .replace(',', '.') // Convert decimal separator
    } else {
      // Format: 10.000 or 10000 -> remove dots (thousands only)
      cleanPrice = cleanPrice.replace(/\./g, '')
    }
    
    // Remove any remaining non-digit characters except dot
    cleanPrice = cleanPrice.replace(/[^\d.]/g, '')
    
    const parsed = parseFloat(cleanPrice)
    return isNaN(parsed) ? 0 : Math.round(parsed)
  }

  private parseStatus(statusText: string): { text: string; available: boolean; status: string } {
    const normalized = statusText.toLowerCase().trim()
    
    // Check for various status indicators
    if (normalized.includes('gangguan') || normalized.includes('error') || normalized.includes('maintenance')) {
      return {
        text: 'Gangguan',
        available: false,
        status: 'disturbance'
      }
    }
    
    if (normalized.includes('buka') || normalized.includes('open') || normalized.includes('normal') || normalized.includes('available')) {
      return {
        text: 'Buka',
        available: true,
        status: 'open'
      }
    }
    
    // Default to open if no clear indicators
    return {
      text: statusText.trim() || 'Buka',
      available: true,
      status: 'open'
    }
  }

  private generateHash(data: string): string {
    return crypto.createHash('md5').update(data).digest('hex')
  }

  getCachedData(): CacheData | null {
    return this.cache.data ? {
      data: this.cache.data,
      lastUpdate: this.cache.lastUpdate,
      lastFetch: this.cache.lastFetch
    } : null
  }

  getCacheInfo(): {
    hasData: boolean
    lastUpdate: string | null
    lastFetch: string | null
    dataCount: number
  } {
    return {
      hasData: !!this.cache.data,
      lastUpdate: this.cache.lastUpdate,
      lastFetch: this.cache.lastFetch,
      dataCount: this.cache.data ? this.cache.data.length : 0
    }
  }

  // Initialize with sample data for development
  private initializeSampleData(): void {
    const sampleProducts: Product[] = [
      {
        category: 'TELKOMSEL',
        code: 'S5',
        description: 'Telkomsel 5.000',
        price: 5800,
        status: {
          text: 'Buka',
          available: true,
          status: 'open'
        }
      },
      {
        category: 'TELKOMSEL',
        code: 'S10',
        description: 'Telkomsel 10.000',
        price: 10800,
        status: {
          text: 'Buka',
          available: true,
          status: 'open'
        }
      },
      {
        category: 'INDOSAT OOREDOO',
        code: 'I5',
        description: 'Indosat 5.000',
        price: 5600,
        status: {
          text: 'Buka',
          available: true,
          status: 'open'
        }
      },
      {
        category: 'XL',
        code: 'X5',
        description: 'XL 5.000',
        price: 5700,
        status: {
          text: 'Buka',
          available: true,
          status: 'open'
        }
      },
      {
        category: 'AXIS',
        code: 'A5',
        description: 'Axis 5.000',
        price: 5600,
        status: {
          text: 'Buka',
          available: true,
          status: 'open'
        }
      }
    ]

    this.cache = {
      data: sampleProducts,
      hash: 'sample-data',
      lastUpdate: new Date().toISOString(),
      lastFetch: new Date().toISOString()
    }
  }
}

// Export singleton instance
export const scraperService = new ScraperService()
export type { Product, CacheData }
