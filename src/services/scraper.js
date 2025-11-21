const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');
const { logger } = require('../utils/logger');
const telegramService = require('./telegram');

class ScraperService {
    constructor() {
        this.targetUrl = process.env.SCRAPER_URL || 'https://himalayareload.otoreport.com/harga.js.php?id=b61804374cb7e3d207028ac05b492f82265047801111a2c0bc3bb288a7a843341b24cdc21347fbc9ba602392b435df468647-6';
        this.cache = {
            data: null,
            hash: null,
            lastUpdate: null,
            lastFetch: null
        };
    }

    async fetchData() {
        try {
            logger.info('Fetching data from source...');

            const response = await axios.get(this.targetUrl, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            const html = response.data;
            const hash = this.generateHash(html);

            // Check if data has changed
            if (this.cache.hash === hash) {
                logger.info('Data has not changed, using cached data');
                this.cache.lastFetch = new Date().toISOString();
                return {
                    data: this.cache.data,
                    updated: false,
                    lastUpdate: this.cache.lastUpdate,
                    lastFetch: this.cache.lastFetch
                };
            }

            // Parse and extract data
            const parsedData = this.parseHtml(html);

            // Detect changes if we have previous data
            let changes = [];
            if (this.cache.data) {
                changes = this.detectChanges(this.cache.data, parsedData);
            }

            // Update cache
            this.cache = {
                data: parsedData,
                hash: hash,
                lastUpdate: new Date().toISOString(),
                lastFetch: new Date().toISOString()
            };

            logger.info(`Data updated successfully. Found ${parsedData.length} product categories`);

            // Send Telegram notifications for changes
            if (changes.length > 0) {
                logger.info(`Detected ${changes.length} changes, sending Telegram notification`);
                await telegramService.notifyDataChanges(changes);
            }

            return {
                data: parsedData,
                updated: true,
                lastUpdate: this.cache.lastUpdate,
                lastFetch: this.cache.lastFetch,
                changes: changes
            };

        } catch (error) {
            logger.error('Error fetching data:', error.message);

            // Return cached data if available, even if stale
            if (this.cache.data) {
                logger.warn('Returning stale cached data due to fetch error');
                return {
                    data: this.cache.data,
                    updated: false,
                    lastUpdate: this.cache.lastUpdate,
                    lastFetch: this.cache.lastFetch,
                    error: error.message
                };
            }

            throw new Error(`Failed to fetch data: ${error.message}`);
        }
    }

    detectChanges(oldData, newData) {
        const changes = [];
        const oldProductsMap = this.createProductMap(oldData);
        const newProductsMap = this.createProductMap(newData);

        // Check for modified products
        for (const [key, newProduct] of Object.entries(newProductsMap)) {
            const oldProduct = oldProductsMap[key];

            if (oldProduct) {
                // Product exists, check for changes
                const change = {
                    code: newProduct.code,
                    category: newProduct.category,
                    price: newProduct.price,
                    status: newProduct.status
                };

                let hasChange = false;

                // Check price change
                if (oldProduct.price !== newProduct.price) {
                    change.priceChange = {
                        old: oldProduct.price,
                        new: newProduct.price,
                        difference: newProduct.price - oldProduct.price,
                        type: newProduct.price > oldProduct.price ? 'increase' : 'decrease'
                    };
                    hasChange = true;
                }

                // Check status change
                if (oldProduct.status.text !== newProduct.status.text || oldProduct.status.available !== newProduct.status.available) {
                    change.statusChange = {
                        old: oldProduct.status,
                        new: newProduct.status
                    };
                    hasChange = true;
                }

                if (hasChange) {
                    changes.push(change);
                }
            }
        }

        return changes;
    }

    createProductMap(data) {
        const map = {};
        data.forEach(product => {
            const key = `${product.category}-${product.code}`;
            map[key] = product;
        });
        return map;
    }

    parseHtml(html) {
        const $ = cheerio.load(html);
        const products = [];

        $('.tablewrapper').each((index, wrapper) => {
            const $wrapper = $(wrapper);
            const $table = $wrapper.find('.tabel');

            // Get category name from the first header row
            const category = $table.find('tr.head').first().find('td').first().text().trim();

            // Find all product rows (skip header rows)
            $table.find('tr').each((rowIndex, row) => {
                const $row = $(row);

                // Skip header rows and empty rows
                if ($row.hasClass('head') || $row.find('td').length < 4) {
                    return;
                }

                const $cells = $row.find('td');
                if ($cells.length >= 4) {
                    const product = {
                        category: category,
                        code: $cells.eq(0).text().trim(),
                        description: $cells.eq(1).text().trim(),
                        price: this.parsePrice($cells.eq(2).text().trim()),
                        status: this.parseStatus($cells.eq(3).text().trim())
                    };

                    // Only add valid products
                    if (product.code && product.description) {
                        products.push(product);
                    }
                }
            });
        });

        return products;
    }

    parsePrice(priceText) {
        // Remove dots and convert to number
        const cleanPrice = priceText.replace(/\./g, '').replace(/[^0-9]/g, '');
        return cleanPrice ? parseInt(cleanPrice, 10) : 0;
    }

    parseStatus(statusText) {
        const normalized = statusText.toLowerCase().trim();
        return {
            text: statusText.trim(),
            available: normalized.includes('open') || normalized.includes('normal'),
            status: normalized.includes('gangguan') ? 'disturbance' :
                normalized.includes('open') ? 'open' : 'unknown'
        };
    }

    generateHash(data) {
        return crypto.createHash('md5').update(data).digest('hex');
    }

    getCachedData() {
        return this.cache.data ? {
            data: this.cache.data,
            lastUpdate: this.cache.lastUpdate,
            lastFetch: this.cache.lastFetch
        } : null;
    }

    getCacheInfo() {
        return {
            hasData: !!this.cache.data,
            lastUpdate: this.cache.lastUpdate,
            lastFetch: this.cache.lastFetch,
            dataCount: this.cache.data ? this.cache.data.length : 0
        };
    }

    async testTelegramNotification() {
        return await telegramService.testConnection();
    }
}

module.exports = new ScraperService();
