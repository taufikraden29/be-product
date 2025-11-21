/**
 * Currency formatting utilities for Indonesian Rupiah
 */

/**
 * Format number to Indonesian Rupiah currency
 * @param {number} amount - The amount to format
 * @param {boolean} showSymbol - Whether to show Rp symbol (default: true)
 * @returns {string} Formatted currency string
 */
function formatToRupiah(amount, showSymbol = true) {
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
 * @param {number} amount - The amount to format
 * @param {boolean} showSymbol - Whether to show Rp symbol (default: true)
 * @returns {string} Compact formatted currency string
 */
function formatToCompactRupiah(amount, showSymbol = true) {
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
 * @param {string} rupiahString - The rupiah string to parse
 * @returns {number} Parsed number
 */
function parseRupiah(rupiahString) {
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
 * @param {number} oldPrice - Old price
 * @param {number} newPrice - New price
 * @returns {object} Formatted price change object
 */
function formatPriceChange(oldPrice, newPrice) {
    const difference = newPrice - oldPrice;
    const percentage = oldPrice > 0 ? ((difference / oldPrice) * 100).toFixed(1) : 0;
    const type = difference > 0 ? 'increase' : 'decrease';
    const icon = type === 'increase' ? '📈' : '📉';
    
    return {
        old: formatToRupiah(oldPrice),
        new: formatToRupiah(newPrice),
        difference: formatToRupiah(Math.abs(difference)),
        percentage: `${Math.abs(percentage)}%`,
        type,
        icon,
        text: `${formatToRupiah(oldPrice)} → ${formatToRupiah(newPrice)} (${type === 'increase' ? '+' : '-'}${Math.abs(percentage)}%)`
    };
}

/**
 * Format large numbers with suffix (K, M, B)
 * @param {number} num - The number to format
 * @returns {string} Formatted number with suffix
 */
function formatLargeNumber(num) {
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
 * @param {number} price - The price to categorize
 * @returns {string} Price range description
 */
function getPriceRangeDescription(price) {
    if (price < 10000) {
        return 'Budget (< Rp 10K)';
    } else if (price < 50000) {
        return 'Ekonomis (Rp 10K - 50K)';
    } else if (price < 100000) {
        return 'Menengah (Rp 50K - 100K)';
    } else if (price < 500000) {
        return 'Premium (Rp 100K - 500K)';
    } else {
        return 'Ekslusif (> Rp 500K)';
    }
}

/**
 * Validate price input
 * @param {any} value - The value to validate
 * @returns {object} Validation result
 */
function validatePrice(value) {
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

module.exports = {
    formatToRupiah,
    formatToCompactRupiah,
    parseRupiah,
    formatPriceChange,
    formatLargeNumber,
    getPriceRangeDescription,
    validatePrice
};