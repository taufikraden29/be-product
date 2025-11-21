/**
 * Client-side currency formatting utilities for Indonesian Rupiah
 */

/**
 * Format number to Indonesian Rupiah currency
 */
export function formatToRupiah(amount: number, showSymbol: boolean = true): string {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return showSymbol ? 'Rp 0' : '0';
    }

    const formatted = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);

    if (!showSymbol) {
        return formatted.replace(/Rp\s?/, '').trim();
    }

    return formatted;
}

/**
 * Format number to compact rupiah (e.g., 1.5M, 500K)
 */
export function formatToCompactRupiah(amount: number, showSymbol: boolean = true): string {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return showSymbol ? 'Rp 0' : '0';
    }

    const symbol = showSymbol ? 'Rp ' : '';
    
    if (amount >= 1000000000) {
        return `${symbol}${(amount / 1000000000).toFixed(1)}B`;
    } else if (amount >= 1000000) {
        return `${symbol}${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
        return `${symbol}${(amount / 1000).toFixed(0)}K`;
    }
    
    return `${symbol}${amount.toLocaleString('id-ID')}`;
}

/**
 * Parse rupiah string back to number
 */
export function parseRupiah(rupiahString: string): number {
    if (typeof rupiahString !== 'string') {
        return 0;
    }

    // Remove all non-numeric characters except dots and commas
    const cleanString = rupiahString
        .replace(/Rp\s?/g, '')
        .replace(/\./g, '')
        .replace(/,/g, '')
        .trim();
    
    const number = parseInt(cleanString, 10);
    return isNaN(number) ? 0 : number;
}

/**
 * Format price change for display
 */
export function formatPriceChange(oldPrice: number, newPrice: number) {
    const difference = newPrice - oldPrice;
    const percentage = oldPrice > 0 ? ((difference / oldPrice) * 100).toFixed(1) : '0';
    const type = difference > 0 ? 'increase' : 'decrease';
    const icon = type === 'increase' ? '📈' : '📉';
    
    return {
        old: formatToRupiah(oldPrice),
        new: formatToRupiah(newPrice),
        difference: formatToRupiah(Math.abs(difference)),
        percentage: `${Math.abs(Number(percentage))}%`,
        type,
        icon,
        text: `${formatToRupiah(oldPrice)} → ${formatToRupiah(newPrice)} (${type === 'increase' ? '+' : '-'}${Math.abs(Number(percentage))}%)`
    };
}

/**
 * Format large numbers with suffix (K, M, B)
 */
export function formatLargeNumber(num: number): string {
    if (typeof num !== 'number' || isNaN(num)) {
        return '0';
    }

    if (num >= 1000000000) {
        return `${(num / 1000000000).toFixed(1)}B`;
    } else if (num >= 1000000) {
        return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
        return `${(num / 1000).toFixed(0)}K`;
    }
    
    return num.toLocaleString('id-ID');
}

/**
 * Get price range description
 */
export function getPriceRangeDescription(price: number): string {
    if (price < 10000) {
        return 'Super Murah (< Rp 10rb)';
    } else if (price < 25000) {
        return 'Budget (Rp 10rb - 25rb)';
    } else if (price < 50000) {
        return 'Ekonomis (Rp 25rb - 50rb)';
    } else if (price < 100000) {
        return 'Menengah (Rp 50rb - 100rb)';
    } else if (price < 250000) {
        return 'Premium (Rp 100rb - 250rb)';
    } else {
        return 'Eksklusif (> Rp 250rb)';
    }
}

/**
 * Validate price input
 */
export function validatePrice(value: any): { isValid: boolean; error?: string; value?: number } {
    const num = typeof value === 'string' ? parseRupiah(value) : value;
    
    if (typeof num !== 'number' || isNaN(num)) {
        return { isValid: false, error: 'Harga harus berupa angka' };
    }
    
    if (num < 0) {
        return { isValid: false, error: 'Harga tidak boleh negatif' };
    }
    
    if (num > 10000000) {
        return { isValid: false, error: 'Harga terlalu besar (maksimal Rp 10 juta)' };
    }
    
    return { isValid: true, value: num };
}

/**
 * Format percentage with proper symbol
 */
export function formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
}

/**
 * Get price color class based on value
 */
export function getPriceColorClass(price: number): string {
    if (price < 10000) {
        return 'text-green-600'; // Super Murah - Green
    } else if (price < 25000) {
        return 'text-blue-600'; // Budget - Blue
    } else if (price < 50000) {
        return 'text-cyan-600'; // Ekonomis - Cyan
    } else if (price < 100000) {
        return 'text-yellow-600'; // Menengah - Yellow
    } else if (price < 250000) {
        return 'text-orange-600'; // Premium - Orange
    } else {
        return 'text-red-600'; // Eksklusif - Red
    }
}