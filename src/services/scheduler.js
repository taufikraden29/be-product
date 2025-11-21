const cron = require('node-cron');
const scraperService = require('./scraper');
const { logger } = require('../utils/logger');

class SchedulerService {
    constructor() {
        this.isRunning = false;
        this.task = null;
        // Use a simpler cron pattern to avoid parsing issues
        this.updateInterval = '* * * * *'; // Every minute by default
    }

    startScheduler() {
        if (this.isRunning) {
            logger.warn('Scheduler is already running');
            return;
        }

        // Override interval from environment if valid
        const envInterval = process.env.UPDATE_INTERVAL;
        if (envInterval && this.isValidCronPattern(envInterval)) {
            this.updateInterval = envInterval;
        }

        logger.info(`Starting scheduler with interval: ${this.updateInterval}`);

        // Initial data fetch
        this.performUpdate();

        // Schedule regular updates
        this.task = cron.schedule(this.updateInterval, () => {
            this.performUpdate();
        }, {
            scheduled: false
        });

        this.task.start();
        this.isRunning = true;

        logger.info('Scheduler started successfully');
    }

    isValidCronPattern(pattern) {
        // Basic validation - should be 5 parts separated by spaces
        if (!pattern || typeof pattern !== 'string') {
            return false;
        }

        const parts = pattern.trim().split(/\s+/);
        if (parts.length !== 5) {
            return false;
        }

        // Very basic validation - just check each part is not empty
        return parts.every(part => part.length > 0);
    }

    stopScheduler() {
        if (!this.isRunning) {
            logger.warn('Scheduler is not running');
            return;
        }

        if (this.task) {
            this.task.stop();
            this.task = null;
        }

        this.isRunning = false;
        logger.info('Scheduler stopped');
    }

    async performUpdate() {
        try {
            logger.info('Performing scheduled data update...');
            const result = await scraperService.fetchData();

            if (result.updated) {
                logger.info(`Scheduled update completed. Data was refreshed.`);
            } else {
                logger.info('Scheduled update completed. No changes detected.');
            }

            return result;
        } catch (error) {
            logger.error('Scheduled update failed:', error.message);

            // Don't throw error to prevent cron from stopping
            // Just log it and continue
            return null;
        }
    }

    async manualUpdate() {
        logger.info('Performing manual data update...');
        return await this.performUpdate();
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            interval: this.updateInterval,
            cacheInfo: scraperService.getCacheInfo()
        };
    }
}

const schedulerService = new SchedulerService();

module.exports = {
    startScheduler: () => schedulerService.startScheduler(),
    stopScheduler: () => schedulerService.stopScheduler(),
    manualUpdate: () => schedulerService.manualUpdate(),
    getStatus: () => schedulerService.getStatus()
};
