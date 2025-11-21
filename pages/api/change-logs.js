// Change logs API endpoint
const { changeTracker } = require('../../utils/changeLogger');
const { formatToRupiah, formatPriceChange } = require('../../utils/currency');

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { method, query } = req;

        if (method === 'GET') {
            const limit = parseInt(query.limit) || 20;
            const includeFile = query.includeFile === 'true';
            const onlySignificant = query.onlySignificant === 'true';

            let memoryLogs = changeTracker.getRecentChanges(limit);
            let fileLogs = [];

            // Include file logs if requested
            if (includeFile) {
                fileLogs = await changeTracker.getChangeLogsFromFile(limit);
            }

            // Combine and sort logs
            const allLogs = [...memoryLogs, ...fileLogs]
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit);

            // Filter only significant changes if requested
            const filteredLogs = onlySignificant ? 
                changeTracker.getSignificantChanges(allLogs) : 
                allLogs;

            // Process logs for better frontend display
            const processedLogs = filteredLogs.map(log => {
                if (log.changes && Array.isArray(log.changes)) {
                    return {
                        ...log,
                        changes: log.changes.map(change => {
                            const processedChange = { ...change };
                            
                            // Add computed fields for easier display
                            if (change.priceChange) {
                                const formattedChange = formatPriceChange(change.priceChange.old, change.priceChange.new);
                                processedChange.priceChangeText = formattedChange.text;
                                processedChange.priceChangeIcon = formattedChange.icon;
                                processedChange.priceChangeFormatted = {
                                    old: formattedChange.old,
                                    new: formattedChange.new,
                                    difference: formattedChange.difference,
                                    percentage: formattedChange.percentage
                                };
                            }
                            
                            if (change.statusChange) {
                                processedChange.statusChangeText = `${change.statusChange.old.text} → ${change.statusChange.new.text}`;
                                processedChange.statusChangeIcon = change.statusChange.new.available ? '✅' : '⚠️';
                            }
                            
                            return processedChange;
                        })
                    };
                }
                return log;
            });

            return res.status(200).json({
                success: true,
                data: {
                    logs: processedLogs,
                    meta: {
                        total: processedLogs.length,
                        memoryLogs: memoryLogs.length,
                        fileLogs: fileLogs.length,
                        onlySignificant,
                        limit
                    }
                }
            });
        }

        if (method === 'POST') {
            const { action } = req.body;

            if (action === 'clear-memory') {
                // Clear in-memory change history
                changeTracker.changeHistory = [];
                return res.status(200).json({
                    success: true,
                    message: 'Memory change history cleared'
                });
            }

            if (action === 'get-summary') {
                const recentChanges = changeTracker.getRecentChanges(50);
                const summary = {
                    totalSessions: new Set(recentChanges.map(log => log.sessionId)).size,
                    totalChangeEvents: recentChanges.length,
                    lastActivity: recentChanges.length > 0 ? recentChanges[0].timestamp : null,
                    changeTypes: {
                        priceIncreases: 0,
                        priceDecreases: 0,
                        statusChanges: 0,
                        newProducts: 0,
                        removedProducts: 0
                    }
                };

                recentChanges.forEach(log => {
                    if (log.summary) {
                        summary.changeTypes.priceIncreases += log.summary.priceChanges.increased;
                        summary.changeTypes.priceDecreases += log.summary.priceChanges.decreased;
                        summary.changeTypes.statusChanges += (log.summary.statusChanges.opened + log.summary.statusChanges.disturbed);
                        summary.changeTypes.newProducts += log.summary.newProducts;
                        summary.changeTypes.removedProducts += log.summary.removedProducts;
                    }
                });

                return res.status(200).json({
                    success: true,
                    data: summary
                });
            }

            return res.status(400).json({
                success: false,
                error: 'Invalid action',
                message: 'Supported actions: clear-memory, get-summary'
            });
        }

        return res.status(405).json({
            success: false,
            error: 'Method Not Allowed',
            message: 'Only GET and POST methods are supported'
        });

    } catch (error) {
        console.error('Error in change-logs API:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: error.message
        });
    }
}