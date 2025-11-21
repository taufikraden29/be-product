const express = require('express');
const router = express.Router();
const scraperService = require('../services/scraper');
const { manualUpdate, getStatus } = require('../services/scheduler');
const { logger } = require('../utils/logger');

/**
 * @route   GET /api/products
 * @desc    Get all cached products
 * @access  Public
 */
router.get('/products', (req, res) => {
    try {
        const cachedData = scraperService.getCachedData();

        if (!cachedData) {
            return res.status(404).json({
                error: 'No data available',
                message: 'Please try again in a moment while we fetch the latest data'
            });
        }

        res.json({
            success: true,
            data: cachedData.data,
            metadata: {
                lastUpdate: cachedData.lastUpdate,
                lastFetch: cachedData.lastFetch,
                totalProducts: cachedData.data.length
            }
        });
    } catch (error) {
        logger.error('Error fetching products:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch products'
        });
    }
});

/**
 * @route   GET /api/products/category/:category
 * @desc    Get products by category
 * @access  Public
 */
router.get('/products/category/:category', (req, res) => {
    try {
        const { category } = req.params;
        const cachedData = scraperService.getCachedData();

        if (!cachedData) {
            return res.status(404).json({
                error: 'No data available',
                message: 'Please try again in a moment while we fetch the latest data'
            });
        }

        const filteredProducts = cachedData.data.filter(product =>
            product.category.toLowerCase().includes(category.toLowerCase())
        );

        res.json({
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
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch products by category'
        });
    }
});

/**
 * @route   GET /api/products/search
 * @desc    Search products by code or description
 * @access  Public
 */
router.get('/products/search', (req, res) => {
    try {
        const { q, category } = req.query;
        const cachedData = scraperService.getCachedData();

        if (!cachedData) {
            return res.status(404).json({
                error: 'No data available',
                message: 'Please try again in a moment while we fetch the latest data'
            });
        }

        let filteredProducts = cachedData.data;

        // Filter by category if specified
        if (category) {
            filteredProducts = filteredProducts.filter(product =>
                product.category.toLowerCase().includes(category.toLowerCase())
            );
        }

        // Search by code or description if query specified
        if (q) {
            const searchQuery = q.toLowerCase();
            filteredProducts = filteredProducts.filter(product =>
                product.code.toLowerCase().includes(searchQuery) ||
                product.description.toLowerCase().includes(searchQuery)
            );
        }

        res.json({
            success: true,
            data: filteredProducts,
            metadata: {
                query: { q, category },
                totalProducts: filteredProducts.length,
                lastUpdate: cachedData.lastUpdate
            }
        });
    } catch (error) {
        logger.error('Error searching products:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to search products'
        });
    }
});

/**
 * @route   GET /api/products/available
 * @desc    Get only available products
 * @access  Public
 */
router.get('/products/available', (req, res) => {
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

        res.json({
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
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch available products'
        });
    }
});

/**
 * @route   GET /api/categories
 * @desc    Get all unique categories
 * @access  Public
 */
router.get('/categories', (req, res) => {
    try {
        const cachedData = scraperService.getCachedData();

        if (!cachedData) {
            return res.status(404).json({
                error: 'No data available',
                message: 'Please try again in a moment while we fetch the latest data'
            });
        }

        const categories = [...new Set(cachedData.data.map(product => product.category))];

        res.json({
            success: true,
            data: categories,
            metadata: {
                totalCategories: categories.length,
                lastUpdate: cachedData.lastUpdate
            }
        });
    } catch (error) {
        logger.error('Error fetching categories:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch categories'
        });
    }
});

/**
 * @route   POST /api/refresh
 * @desc    Manually trigger data refresh
 * @access  Public
 */
router.post('/refresh', async (req, res) => {
    try {
        logger.info('Manual refresh triggered via API');
        const result = await manualUpdate();

        if (!result) {
            return res.status(500).json({
                error: 'Refresh Failed',
                message: 'Failed to refresh data'
            });
        }

        res.json({
            success: true,
            message: result.updated ? 'Data refreshed successfully' : 'No changes detected',
            metadata: {
                updated: result.updated,
                lastUpdate: result.lastUpdate,
                lastFetch: result.lastFetch,
                totalProducts: result.data.length
            }
        });
    } catch (error) {
        logger.error('Error during manual refresh:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to refresh data'
        });
    }
});

/**
 * @route   GET /api/status
 * @desc    Get scraper and scheduler status
 * @access  Public
 */
router.get('/status', (req, res) => {
    try {
        const status = getStatus();
        const cacheInfo = scraperService.getCacheInfo();

        res.json({
            success: true,
            data: {
                scheduler: status,
                cache: cacheInfo,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        logger.error('Error fetching status:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch status'
        });
    }
});

module.exports = router;
