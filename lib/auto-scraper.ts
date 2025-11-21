/**
 * Auto-scraper utility for client-side periodic data fetching
 * This runs in the browser and polls the server for fresh data
 */

export interface AutoScraperOptions {
  interval?: number // in milliseconds, default 60000 (1 minute)
  onUpdate?: (data: any) => void
  onError?: (error: Error) => void
  autoStart?: boolean
}

export class AutoScraper {
  private interval: number
  private timerId: NodeJS.Timeout | null = null
  private isRunning: boolean = false
  private onUpdate?: (data: any) => void
  private onError?: (error: Error) => void
  private lastFetch: string | null = null

  constructor(options: AutoScraperOptions = {}) {
    this.interval = options.interval || 60000 // Default 1 minute
    this.onUpdate = options.onUpdate
    this.onError = options.onError
    
    if (options.autoStart) {
      this.start()
    }
  }

  start() {
    if (this.isRunning) {
      console.warn('AutoScraper is already running')
      return
    }

    console.log('🚀 AutoScraper started - polling every', this.interval / 1000, 'seconds')
    this.isRunning = true
    
    // Fetch immediately
    this.fetchData()
    
    // Then fetch at regular intervals
    this.timerId = setInterval(() => {
      this.fetchData()
    }, this.interval)
  }

  stop() {
    if (!this.isRunning) {
      console.warn('AutoScraper is not running')
      return
    }

    if (this.timerId) {
      clearInterval(this.timerId)
      this.timerId = null
    }

    this.isRunning = false
    console.log('⏹️ AutoScraper stopped')
  }

  private async fetchData() {
    try {
      console.log('🔄 Fetching fresh data...')
      
      const response = await fetch('/data.json?t=' + Date.now()) // Cache busting
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      // Check if data has been updated since last fetch
      if (data.metadata?.lastFetch !== this.lastFetch) {
        console.log('✅ New data received:', {
          products: data.metadata?.totalProducts || 0,
          lastUpdate: data.metadata?.lastUpdate,
          categories: data.metadata?.categories?.length || 0
        })
        
        this.lastFetch = data.metadata?.lastFetch || null
        
        if (this.onUpdate) {
          this.onUpdate(data)
        }
      } else {
        console.log('ℹ️ Data unchanged')
      }

    } catch (error) {
      console.error('❌ Error fetching data:', error)
      
      if (this.onError && error instanceof Error) {
        this.onError(error)
      }
    }
  }

  setInterval(newInterval: number) {
    const wasRunning = this.isRunning
    
    if (wasRunning) {
      this.stop()
    }
    
    this.interval = newInterval
    
    if (wasRunning) {
      this.start()
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      interval: this.interval,
      intervalSeconds: this.interval / 1000,
      lastFetch: this.lastFetch
    }
  }

  // Force fetch immediately
  async forceFetch() {
    await this.fetchData()
  }
}

// Singleton instance for global use
let globalAutoScraper: AutoScraper | null = null

export function getAutoScraper(options?: AutoScraperOptions): AutoScraper {
  if (!globalAutoScraper) {
    globalAutoScraper = new AutoScraper(options)
  }
  return globalAutoScraper
}

export function createAutoScraper(options?: AutoScraperOptions): AutoScraper {
  return new AutoScraper(options)
}
