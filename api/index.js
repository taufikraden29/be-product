// Simple logger for Vercel
const logger = {
    info: (message) => console.log(`[INFO] ${message}`),
    error: (message, error) => console.error(`[ERROR] ${message}`, error || '')
};

// Initialize environment variables
require('dotenv').config();

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { url, method } = req;
        logger.info(`${method} ${url}`);

        // Health check endpoints
        if (url === '/health' || url === '/up') {
            return res.status(200).json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                uptime: process.uptime() || 0
            });
        }

        // Import scraper service dynamically for each request
        let scraperService;
        try {
            scraperService = require('./scraper');
        } catch (error) {
            logger.error('Failed to load scraper service:', error);
            return res.status(500).json({
                error: 'Service Unavailable',
                message: 'Scraper service is not available'
            });
        }

        // API routes
        if (url.startsWith('/api')) {
            // Create a simple Express-like router
            const path = url.replace('/api', '');

            // Handle different API endpoints
            if (path === '/products' && method === 'GET') {
                return await handleGetProducts(req, res, scraperService);
            } else if (path === '/products/search' && method === 'GET') {
                return await handleSearchProducts(req, res, scraperService);
            } else if (path.startsWith('/products/category/') && method === 'GET') {
                return await handleGetProductsByCategory(req, res, scraperService);
            } else if (path === '/products/available' && method === 'GET') {
                return await handleGetAvailableProducts(req, res, scraperService);
            } else if (path === '/categories' && method === 'GET') {
                return await handleGetCategories(req, res, scraperService);
            } else if (path === '/status' && method === 'GET') {
                return await handleGetStatus(req, res, scraperService);
            } else if (path === '/refresh' && method === 'POST') {
                return await handleRefresh(req, res, scraperService);
            } else if (path === '/test-telegram' && method === 'POST') {
                return await handleTestTelegram(req, res, scraperService);
            }
        }

        // 404 - Route not found
        return res.status(404).json({
            error: 'Route not found',
            message: `Cannot ${method} ${url}`
        });

    } catch (error) {
        logger.error('Unhandled error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Something went wrong'
        });
    }
};

// Handler functions
async function handleGetProducts(req, res, scraperService) {
    try {
        const cachedData = scraperService.getCachedData();

        if (!cachedData) {
            return res.status(404).json({
                error: 'No data available',
                message: 'Please try again in a moment while we fetch the latest data'
            });
        }

        // Parse query parameters
        const url = new URL(req.url, `http://${req.headers.host}`);
        const page = parseInt(url.searchParams.get('page')) || 1;
        const limit = parseInt(url.searchParams.get('limit')) || 100;

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedProducts = cachedData.data.slice(startIndex, endIndex);
        const totalPages = Math.ceil(cachedData.data.length / limit);

        return res.json({
            success: true,
            data: paginatedProducts,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: cachedData.data.length,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            metadata: {
                lastUpdate: cachedData.lastUpdate,
                lastFetch: cachedData.lastFetch,
                totalProducts: cachedData.data.length
            }
        });
    } catch (error) {
        logger.error('Error fetching products:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch products'
        });
    }
}

async function handleSearchProducts(req, res, scraperService) {
    try {
        const cachedData = scraperService.getCachedData();

        if (!cachedData) {
            return res.status(404).json({
                error: 'No data available',
                message: 'Please try again in a moment while we fetch the latest data'
            });
        }

        // Parse query parameters
        const url = new URL(req.url, `http://${req.headers.host}`);
        const q = url.searchParams.get('q');
        const category = url.searchParams.get('category');
        const page = parseInt(url.searchParams.get('page')) || 1;
        const limit = parseInt(url.searchParams.get('limit')) || 50;

        let filteredProducts = cachedData.data;

        // Filter by category
        if (category) {
            filteredProducts = filteredProducts.filter(product =>
                product.category.toLowerCase().includes(category.toLowerCase())
            );
        }

        // Search by code or description
        if (q) {
            const searchQuery = q.toLowerCase();
            filteredProducts = filteredProducts.filter(product =>
                product.code.toLowerCase().includes(searchQuery) ||
                product.description.toLowerCase().includes(searchQuery)
            );
        }

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
        const totalPages = Math.ceil(filteredProducts.length / limit);

        return res.json({
            success: true,
            data: paginatedProducts,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalItems: filteredProducts.length,
                itemsPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            metadata: {
                query: { q, category },
                totalProducts: filteredProducts.length,
                lastUpdate: cachedData.lastUpdate
            }
        });
    } catch (error) {
        logger.error('Error searching products:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to search products'
        });
    }
}

async function handleGetProductsByCategory(req, res, scraperService) {
    try {
        const cachedData = scraperService.getCachedData();

        if (!cachedData) {
            return res.status(404).json({
                error: 'No data available',
                message: 'Please try again in a moment while we fetch the latest data'
            });
        }

        // Extract category from URL
        const pathParts = req.url.split('/');
        const category = decodeURIComponent(pathParts[pathParts.length - 1]);

        const filteredProducts = cachedData.data.filter(product =>
            product.category.toLowerCase().includes(category.toLowerCase())
        );

        return res.json({
            success: true,
            data: filteredProducts,
            metadata: {
                category: category,
                totalProducts: filteredProducts.length,
                lastUpdate: cachedData.lastUpdate
            }
        });
    } catch (error) {
        logger.error('Error fetching products by category:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch products by category'
        });
    }
}

async function handleGetAvailableProducts(req, res, scraperService) {
    try {
        const cachedData = scraperService.getCachedData();

        if (!cachedData) {
            return res.status(404).json({
                error: 'No data available',
                message: 'Please try again in a moment while we fetch the latest data'
            });
        }

        const availableProducts = cachedData.data.filter(product =>
            product.status.available
        );

        return res.json({
            success: true,
            data: availableProducts,
            metadata: {
                totalProducts: availableProducts.length,
                unavailableProducts: cachedData.data.length - availableProducts.length,
                lastUpdate: cachedData.lastUpdate
            }
        });
    } catch (error) {
        logger.error('Error fetching available products:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch available products'
        });
    }
}

async function handleGetCategories(req, res, scraperService) {
    try {
        const cachedData = scraperService.getCachedData();

        if (!cachedData) {
            return res.status(404).json({
                error: 'No data available',
                message: 'Please try again in a moment while we fetch the latest data'
            });
        }

        const categories = [...new Set(cachedData.data.map(product => product.category))];

        return res.json({
            success: true,
            data: categories,
            metadata: {
                totalCategories: categories.length,
                lastUpdate: cachedData.lastUpdate
            }
        });
    } catch (error) {
        logger.error('Error fetching categories:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch categories'
        });
    }
}

async function handleGetStatus(req, res, scraperService) {
    try {
        try {
            const { getStatus } = require('../src/services/scheduler');
            const status = getStatus();
            const cacheInfo = scraperService.getCacheInfo();

            return res.json({
                success: true,
                data: {
                    scheduler: status,
                    cache: cacheInfo,
                    timestamp: new Date().toISOString()
                }
            });
        } catch (schedulerError) {
            // Fallback if scheduler is not available in serverless
            return res.json({
                success: true,
                data: {
                    scheduler: { isRunning: false, error: 'Scheduler not available in serverless' },
                    cache: scraperService.getCacheInfo(),
                    timestamp: new Date().toISOString()
                }
            });
        }
    } catch (error) {
        logger.error('Error fetching status:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch status'
        });
    }
}

async function handleRefresh(req, res, scraperService) {
    try {
        try {
            const result = await scraperService.fetchData();
            return res.json({
                success: true,
                message: result.updated ? 'Data refreshed successfully' : 'No changes detected',
                metadata: {
                    updated: result.updated,
                    lastUpdate: result.lastUpdate,
                    lastFetch: result.lastFetch,
                    totalProducts: result.data ? result.data.length : 0,
                    changes: result.changes || []
                }
            });
        } catch (fetchError) {
            logger.error('Error during refresh:', fetchError);
            return res.status(500).json({
                error: 'Refresh Failed',
                message: 'Failed to refresh data'
            });
        }
    } catch (error) {
        logger.error('Error during manual refresh:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to refresh data'
        });
    }
}

async function handleTestTelegram(req, res, scraperService) {
    try {
        const result = await scraperService.testTelegramNotification();

        return res.json({
            success: result.success,
            message: result.message,
            metadata: {
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('Error testing Telegram notification:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to test Telegram notification'
        });
    }
}
