import { Product } from './scraper'

interface ProductChange {
  code: string
  category: string
  description: string
  oldPrice?: number
  newPrice?: number
  priceChange: 'increase' | 'decrease' | 'same' | 'new'
  oldStatus?: string
  newStatus?: string
  statusChange: 'open' | 'gangguan' | 'same' | 'new'
  changeType: 'price' | 'status' | 'both' | 'new'
  timestamp: string
}

interface ChangeLog {
  timestamp: string
  changes: ProductChange[]
  summary: {
    totalProducts: number
    priceChanges: {
      increased: number
      decreased: number
      new: number
    }
    statusChanges: {
      opened: number
      disturbed: number
      new: number
    }
  }
}

class ChangeDetector {
  private previousData: Map<string, Product> = new Map()
  private changeHistory: ChangeLog[] = []

  // Generate unique key for product
  private getProductKey(product: Product): string {
    return `${product.category}-${product.code}`
  }

  // Detect changes between old and new data
  detectChanges(newProducts: Product[]): ChangeLog {
    const changes: ProductChange[] = []
    const currentData = new Map<string, Product>()
    
    // Build current data map
    newProducts.forEach(product => {
      const key = this.getProductKey(product)
      currentData.set(key, product)
    })

    // Check for changes and new products
    newProducts.forEach(newProduct => {
      const key = this.getProductKey(newProduct)
      const oldProduct = this.previousData.get(key)
      
      if (!oldProduct) {
        // New product
        changes.push({
          code: newProduct.code,
          category: newProduct.category,
          description: newProduct.description,
          newPrice: newProduct.price,
          newStatus: newProduct.status.text,
          priceChange: 'new',
          statusChange: 'new',
          changeType: 'new',
          timestamp: new Date().toISOString()
        })
      } else {
        // Existing product - check for changes
        const priceChange = this.detectPriceChange(oldProduct.price, newProduct.price)
        const statusChange = this.detectStatusChange(oldProduct.status.text, newProduct.status.text)
        
        if (priceChange !== 'same' || statusChange !== 'same') {
          let changeType: ProductChange['changeType']
          
          if (priceChange !== 'same' && statusChange !== 'same') {
            changeType = 'both'
          } else if (priceChange !== 'same') {
            changeType = 'price'
          } else {
            changeType = 'status'
          }

          changes.push({
            code: newProduct.code,
            category: newProduct.category,
            description: newProduct.description,
            oldPrice: oldProduct.price,
            newPrice: newProduct.price,
            priceChange: priceChange,
            oldStatus: oldProduct.status.text,
            newStatus: newProduct.status.text,
            statusChange: statusChange,
            changeType: changeType,
            timestamp: new Date().toISOString()
          })
        }
      }
    })

    // Check for removed products
    this.previousData.forEach((oldProduct, key) => {
        if (!currentData.has(key)) {
          changes.push({
            code: oldProduct.code,
            category: oldProduct.category,
            description: oldProduct.description,
            oldPrice: oldProduct.price,
            oldStatus: oldProduct.status.text,
            priceChange: 'same' as const,
            statusChange: 'same' as const,
            changeType: 'status' as const, // Mark as removed (no longer available)
            timestamp: new Date().toISOString()
          })
        }
    })

    // Generate summary
    const summary = this.generateSummary(changes, newProducts)

    const changeLog: ChangeLog = {
      timestamp: new Date().toISOString(),
      changes,
      summary
    }

    // Update previous data
    this.previousData = currentData
    this.changeHistory.push(changeLog)

    return changeLog
  }

  private detectPriceChange(oldPrice: number, newPrice: number): ProductChange['priceChange'] {
    if (oldPrice < newPrice) return 'increase'
    if (oldPrice > newPrice) return 'decrease'
    return 'same'
  }

  private detectStatusChange(oldStatus: string, newStatus: string): ProductChange['statusChange'] {
    const normalizeStatus = (status: string) => status.toLowerCase().trim()
    
    const oldNormalized = normalizeStatus(oldStatus)
    const newNormalized = normalizeStatus(newStatus)
    
    if (oldNormalized === newNormalized) return 'same'
    if (newNormalized.includes('open') || newNormalized.includes('normal')) return 'open'
    if (newNormalized.includes('gangguan')) return 'gangguan'
    return 'same'
  }

  private generateSummary(changes: ProductChange[], newProducts: Product[]): ChangeLog['summary'] {
    const summary = {
      totalProducts: newProducts.length,
      priceChanges: {
        increased: 0,
        decreased: 0,
        new: 0
      },
      statusChanges: {
        opened: 0,
        disturbed: 0,
        new: 0
      }
    }

    changes.forEach(change => {
      // Price changes
      if (change.priceChange === 'increase') summary.priceChanges.increased++
      else if (change.priceChange === 'decrease') summary.priceChanges.decreased++
      else if (change.priceChange === 'new') summary.priceChanges.new++

      // Status changes
      if (change.statusChange === 'open') summary.statusChanges.opened++
      else if (change.statusChange === 'gangguan') summary.statusChanges.disturbed++
      else if (change.statusChange === 'new') summary.statusChanges.new++
    })

    return summary
  }

  // Get formatted change log for notifications
  getFormattedChangeLog(changeLog: ChangeLog): string {
    let message = `📊 *Laporan Perubahan Data Produk*\n\n`
    message += `🕒 *Waktu:* ${new Date(changeLog.timestamp).toLocaleString('id-ID')}\n\n`

    // Summary
    message += `📈 *Ringkasan Perubahan:*\n`
    message += `• Total Produk: ${changeLog.summary.totalProducts}\n`
    message += `• Harga Naik: ${changeLog.summary.priceChanges.increased}\n`
    message += `• Harga Turun: ${changeLog.summary.priceChanges.decreased}\n`
    message += `• Status Buka: ${changeLog.summary.statusChanges.opened}\n`
    message += `• Status Gangguan: ${changeLog.summary.statusChanges.disturbed}\n\n`

    // Detailed changes (limit to first 10 to avoid message too long)
    const importantChanges = changeLog.changes
      .filter(c => c.changeType === 'price' || c.changeType === 'status' || c.changeType === 'both' || c.changeType === 'new')
      .slice(0, 10)

    if (importantChanges.length > 0) {
      message += `🔍 *Perubahan Penting:*\n`
      
      importantChanges.forEach((change, index) => {
        let changeDetail = ''
        
        if (change.changeType === 'price' || change.changeType === 'both') {
          if (change.priceChange === 'increase') {
            changeDetail = `💰 Harga naik: Rp ${change.oldPrice?.toLocaleString('id-ID')} → Rp ${change.newPrice?.toLocaleString('id-ID')} (+${((change.newPrice! - change.oldPrice!) / change.oldPrice! * 100).toFixed(1)}%)`
          } else if (change.priceChange === 'decrease') {
            changeDetail = `💰 Harga turun: Rp ${change.oldPrice?.toLocaleString('id-ID')} → Rp ${change.newPrice?.toLocaleString('id-ID')} (${((change.newPrice! - change.oldPrice!) / change.oldPrice! * 100).toFixed(1)}%)`
          }
        }
        
        if (change.changeType === 'status' || change.changeType === 'both') {
          if (change.statusChange === 'open') {
            changeDetail += (changeDetail ? ' | ' : '') + '✅ Status: Gangguan → Buka'
          } else if (change.statusChange === 'gangguan') {
            changeDetail += (changeDetail ? ' | ' : '') + '❌ Status: Buka → Gangguan'
          }
        }
        
        message += `${index + 1}. ${change.description}\n   ${changeDetail}\n`
      })
    }

    return message
  }

  // Get recent changes (last 24 hours)
  getRecentChanges(hours: number = 24): ChangeLog[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000)
    return this.changeHistory.filter(log => new Date(log.timestamp) >= cutoff)
  }

  // Check if there are significant changes
  hasSignificantChanges(changeLog: ChangeLog): boolean {
    return (
      changeLog.summary.priceChanges.increased > 0 ||
      changeLog.summary.priceChanges.decreased > 0 ||
      changeLog.summary.statusChanges.opened > 0 ||
      changeLog.summary.statusChanges.disturbed > 0
    )
  }

  // Get change history
  getChangeHistory(): ChangeLog[] {
    return this.changeHistory
  }

  // Clear history
  clearHistory(): void {
    this.changeHistory = []
  }
}

// Export singleton instance
export const changeDetector = new ChangeDetector()
export type { ProductChange, ChangeLog }
