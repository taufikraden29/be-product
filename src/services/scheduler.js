const cron = require('node-cron');
const scraperService = require('./scraper');
const { logger } = require('../utils/logger');

class SchedulerService {
    constructor() {
        this.isRunning = false;
        this.task = null;
        this.updateInterval = process.env.UPDATE_INTERVAL || '* * * * *'; // Every minute by default
    }

    startScheduler() {
        if (this.isRunning) {
            logger.warn('Scheduler is already running');
            return;
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
