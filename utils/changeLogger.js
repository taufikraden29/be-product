const winston = require('winston');
const fs = require('fs');
const path = require('path');
const { formatToRupiah, formatPriceChange } = require('./currency');

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for change logs
const changeLogFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// Create logger specifically for data changes
const changeLogger = winston.createLogger({
    level: 'info',
    format: changeLogFormat,
    transports: [
        // File transport for change logs
        new winston.transports.File({
            filename: path.join(logsDir, 'changes.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            format: changeLogFormat
        }),
        // Separate file for error logs
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 3
        })
    ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    changeLogger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

class ChangeTracker {
    constructor() {
        this.previousData = null;
        this.sessionId = this.generateSessionId();
        this.changeHistory = [];
        this.maxHistorySize = 100;
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Compare current data with previous data and log changes
     * @param {Array} newData - Current scraped data
     * @param {Array} oldData - Previous scraped data
     * @returns {Object} Summary of changes
     */
    detectAndLogChanges(newData, oldData) {
        if (!oldData || !newData) {
            changeLogger.info('Initial data load or missing data', {
                type: 'INITIAL_LOAD',
                sessionId: this.sessionId,
                productCount: newData ? newData.length : 0,
                timestamp: new Date().toISOString()
            });
            return { changes: [], summary: this.getEmptySummary() };
        }

        const oldDataMap = this.createProductMap(oldData);
        const newDataMap = this.createProductMap(newData);
        const changes = [];

        // Detect changes in existing products
        for (const [key, newProduct] of Object.entries(newDataMap)) {
            const oldProduct = oldDataMap[key];

            if (oldProduct) {
                const changeDetails = this.compareProducts(oldProduct, newProduct);
                if (changeDetails) {
                    changes.push(changeDetails);
                }
            } else {
                // New product added
                changes.push({
                    type: 'NEW_PRODUCT',
                    code: newProduct.code,
                    category: newProduct.category,
                    description: newProduct.description,
                    price: newProduct.price,
                    status: newProduct.status,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Detect removed products
        for (const [key, oldProduct] of Object.entries(oldDataMap)) {
            if (!newDataMap[key]) {
                changes.push({
                    type: 'REMOVED_PRODUCT',
                    code: oldProduct.code,
                    category: oldProduct.category,
                    description: oldProduct.description,
                    lastPrice: oldProduct.price,
                    lastStatus: oldProduct.status,
                    timestamp: new Date().toISOString()
                });
            }
        }

        // Log all changes
        if (changes.length > 0) {
            const summary = this.generateSummary(changes);
            
            changeLogger.info('Data changes detected', {
                type: 'CHANGE_BATCH',
                sessionId: this.sessionId,
                timestamp: new Date().toISOString(),
                totalChanges: changes.length,
                summary: summary,
                changes: changes
            });

            // Keep change history in memory
            this.addToHistory(changes, summary);

            return { changes, summary };
        }

        changeLogger.info('No changes detected', {
            type: 'NO_CHANGES',
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            productCount: newData.length
        });

        return { changes: [], summary: this.getEmptySummary() };
    }

    /**
     * Compare two products for changes
     * @param {Object} oldProduct 
     * @param {Object} newProduct 
     * @returns {Object|null} Change details or null if no changes
     */
    compareProducts(oldProduct, newProduct) {
        const changes = {};
        let hasChanges = false;

        // Check price changes
        if (oldProduct.price !== newProduct.price) {
            const priceChangeData = formatPriceChange(oldProduct.price, newProduct.price);
            changes.priceChange = {
                old: oldProduct.price,
                new: newProduct.price,
                oldFormatted: priceChangeData.old,
                newFormatted: priceChangeData.new,
                difference: newProduct.price - oldProduct.price,
                differenceFormatted: priceChangeData.difference,
                type: priceChangeData.type,
                percentage: priceChangeData.percentage,
                icon: priceChangeData.icon,
                text: priceChangeData.text
            };
            hasChanges = true;
        }

        // Check status changes
        if (oldProduct.status.available !== newProduct.status.available || 
            oldProduct.status.text !== newProduct.status.text) {
            changes.statusChange = {
                old: {
                    text: oldProduct.status.text,
                    available: oldProduct.status.available,
                    status: oldProduct.status.status
                },
                new: {
                    text: newProduct.status.text,
                    available: newProduct.status.available,
                    status: newProduct.status.status
                }
            };
            hasChanges = true;
        }

        if (hasChanges) {
            return {
                type: 'PRODUCT_CHANGE',
                code: newProduct.code,
                category: newProduct.category,
                description: newProduct.description,
                timestamp: new Date().toISOString(),
                ...changes
            };
        }

        return null;
    }

    /**
     * Create a map of products for quick lookup
     * @param {Array} data 
     * @returns {Object}
     */
    createProductMap(data) {
        const map = {};
        data.forEach(product => {
            const key = `${product.category}-${product.code}`;
            map[key] = product;
        });
        return map;
    }

    /**
     * Generate summary statistics from changes
     * @param {Array} changes 
     * @returns {Object}
     */
    generateSummary(changes) {
        const summary = {
            total: changes.length,
            priceChanges: {
                increased: 0,
                decreased: 0,
                totalIncrease: 0,
                totalDecrease: 0
            },
            statusChanges: {
                toAvailable: 0,
                toUnavailable: 0,
                opened: 0,
                disturbed: 0
            },
            newProducts: 0,
            removedProducts: 0
        };

        changes.forEach(change => {
            switch (change.type) {
                case 'PRODUCT_CHANGE':
                    if (change.priceChange) {
                        if (change.priceChange.type === 'increase') {
                            summary.priceChanges.increased++;
                            summary.priceChanges.totalIncrease += change.priceChange.difference;
                        } else {
                            summary.priceChanges.decreased++;
                            summary.priceChanges.totalDecrease += Math.abs(change.priceChange.difference);
                        }
                    }
                    
                    if (change.statusChange) {
                        if (change.statusChange.new.available && !change.statusChange.old.available) {
                            summary.statusChanges.toAvailable++;
                            summary.statusChanges.opened++;
                        } else if (!change.statusChange.new.available && change.statusChange.old.available) {
                            summary.statusChanges.toUnavailable++;
                            summary.statusChanges.disturbed++;
                        }
                    }
                    break;
                case 'NEW_PRODUCT':
                    summary.newProducts++;
                    break;
                case 'REMOVED_PRODUCT':
                    summary.removedProducts++;
                    break;
            }
        });

        return summary;
    }

    /**
     * Add changes to in-memory history
     * @param {Array} changes 
     * @param {Object} summary 
     */
    addToHistory(changes, summary) {
        const historyEntry = {
            timestamp: new Date().toISOString(),
            sessionId: this.sessionId,
            summary,
            changes: changes.slice(0, 20) // Limit to first 20 changes for memory efficiency
        };

        this.changeHistory.unshift(historyEntry);
        
        // Keep only recent history
        if (this.changeHistory.length > this.maxHistorySize) {
            this.changeHistory = this.changeHistory.slice(0, this.maxHistorySize);
        }
    }

    /**
     * Get empty summary object
     * @returns {Object}
     */
    getEmptySummary() {
        return {
            total: 0,
            priceChanges: { increased: 0, decreased: 0, totalIncrease: 0, totalDecrease: 0 },
            statusChanges: { toAvailable: 0, toUnavailable: 0, opened: 0, disturbed: 0 },
            newProducts: 0,
            removedProducts: 0
        };
    }

    /**
     * Get recent change history from memory
     * @param {number} limit 
     * @returns {Array}
     */
    getRecentChanges(limit = 10) {
        return this.changeHistory.slice(0, limit);
    }

    /**
     * Read change logs from file
     * @param {number} lines - Number of recent lines to read
     * @returns {Array}
     */
    async getChangeLogsFromFile(lines = 50) {
        try {
            const logPath = path.join(logsDir, 'changes.log');
            
            if (!fs.existsSync(logPath)) {
                return [];
            }

            const data = fs.readFileSync(logPath, 'utf8');
            const logLines = data.trim().split('\n');
            
            return logLines
                .slice(-lines) // Get recent lines
                .map(line => {
                    try {
                        return JSON.parse(line);
                    } catch (e) {
                        return null;
                    }
                })
                .filter(log => log !== null)
                .reverse(); // Most recent first
        } catch (error) {
            changeLogger.error('Error reading change logs from file', { error: error.message });
            return [];
        }
    }

    /**
     * Get filtered changes (only significant changes)
     * @param {Array} logs 
     * @returns {Array}
     */
    getSignificantChanges(logs) {
        return logs.filter(log => 
            log.type === 'CHANGE_BATCH' && 
            log.totalChanges > 0
        );
    }

    /**
     * Log scraper session start
     */
    logSessionStart() {
        changeLogger.info('Scraper session started', {
            type: 'SESSION_START',
            sessionId: this.sessionId,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Log scraper session end
     * @param {Object} sessionStats 
     */
    logSessionEnd(sessionStats = {}) {
        changeLogger.info('Scraper session ended', {
            type: 'SESSION_END',
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            stats: sessionStats
        });
    }
}

// Export singleton instance
const changeTracker = new ChangeTracker();

module.exports = {
    changeLogger,
    changeTracker,
    ChangeTracker
};