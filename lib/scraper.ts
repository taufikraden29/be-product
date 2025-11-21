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
      console.log('Fetching data from source...')

      const response = await axios.get(this.targetUrl, {
        timeout: 25000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      })

      const html = response.data
      const hash = this.generateHash(html)

      // Check if data has changed
      if (this.cache.hash === hash && this.cache.data) {
        console.log('Data has not changed, using cached data')
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

      console.log(`Data updated successfully. Found ${parsedData.length} product categories`)

      return {
        data: parsedData,
        updated: true,
        lastUpdate: this.cache.lastUpdate,
        lastFetch: this.cache.lastFetch
      }

    } catch (error) {
      console.error('Error fetching data:', error)

      // Return cached data if available, even if stale
      if (this.cache.data) {
        console.warn('Returning stale cached data due to fetch error')
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

    $('.tablewrapper').each((index: number, wrapper: any) => {
      const $wrapper = $(wrapper)
      const $table = $wrapper.find('.tabel')

      // Get category name from the first header row
      const category = $table.find('tr.head').first().find('td').first().text().trim()

      // Find all product rows (skip header rows)
      $table.find('tr').each((rowIndex: number, row: any) => {
        const $row = $(row)

        // Skip header rows and empty rows
        if ($row.hasClass('head') || $row.find('td').length < 4) {
          return
        }

        const $cells = $row.find('td')
        if ($cells.length >= 4) {
          const product: Product = {
            category: category,
            code: $cells.eq(0).text().trim(),
            description: $cells.eq(1).text().trim(),
            price: this.parsePrice($cells.eq(2).text().trim()),
            status: this.parseStatus($cells.eq(3).text().trim())
          }

          // Only add valid products
          if (product.code && product.description) {
            products.push(product)
          }
        }
      })
    })

    return products
  }

  private parsePrice(priceText: string): number {
    // Remove dots and convert to number
    const cleanPrice = priceText.replace(/\./g, '').replace(/[^0-9]/g, '')
    return cleanPrice ? parseInt(cleanPrice, 10) : 0
  }

  private parseStatus(statusText: string): { text: string; available: boolean; status: string } {
    const normalized = statusText.toLowerCase().trim()
    return {
      text: statusText.trim(),
      available: normalized.includes('open') || normalized.includes('normal'),
      status: normalized.includes('gangguan') ? 'disturbance' :
        normalized.includes('open') ? 'open' : 'unknown'
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
          text: 'open',
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
          text: 'open',
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
          text: 'open',
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
          text: 'open',
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
          text: 'open',
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
