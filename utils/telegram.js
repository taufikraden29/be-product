// Telegram notification utility using Telegraf
const { Telegraf } = require('telegraf');

// Simple logger
const logger = {
    info: (message) => console.log(`[INFO] ${message}`),
    error: (message, error) => console.error(`[ERROR] ${message}`, error || ''),
    warn: (message) => console.warn(`[WARN] ${message}`)
};

class TelegramService {
    constructor() {
        this.botToken = process.env.TELEGRAM_BOT_TOKEN;
        this.chatId = process.env.TELEGRAM_CHAT_ID;
        this.bot = null;
        
        if (this.botToken) {
            this.bot = new Telegraf(this.botToken);
        }
    }

    isConfigured() {
        return !!(this.botToken && this.chatId);
    }

    async notifyDataChanges(changes) {
        try {
            if (!this.isConfigured()) {
                logger.warn('Telegram credentials not configured');
                return { success: false, message: 'Telegram not configured' };
            }

            if (!changes || changes.length === 0) {
                return { success: true, message: 'No changes to notify' };
            }

            const changeMessages = changes.slice(0, 10).map(change => {
                let message = `🔄 *${change.code}* - ${change.category}\n`;
                message += `💰 Rp ${change.price.toLocaleString()}\n`;
                message += `📊 ${change.status.text}`;
                
                if (change.priceChange) {
                    const arrow = change.priceChange.type === 'increase' ? '📈' : '📉';
                    message += `\n${arrow} ${change.priceChange.old} → ${change.priceChange.new}`;
                }
                return message;
            }).join('\n\n');

            const fullMessage = `🛍️ *Himalaya Reload Update*\n\n${changeMessages}\n\n📅 ${new Date().toLocaleString('id-ID')}`;

            await this.bot.telegram.sendMessage(this.chatId, fullMessage, { 
                parse_mode: 'Markdown',
                disable_web_page_preview: true 
            });

            logger.info(`Telegram notification sent for ${changes.length} changes`);
            return { success: true, message: 'Notification sent successfully' };
        } catch (error) {
            logger.error('Failed to send Telegram notification:', error);
            return { success: false, message: error.message };
        }
    }

    async testConnection() {
        try {
            if (!this.isConfigured()) {
                return { success: false, message: 'Telegram credentials not configured' };
            }

            const botInfo = await this.bot.telegram.getMe();
            logger.info(`Connected to bot: ${botInfo.first_name} (@${botInfo.username})`);

            await this.bot.telegram.sendMessage(
                this.chatId, 
                '✅ *Telegram Connection Test Successful!*\n\nHimalaya Scraper API is ready to send notifications.',
                { parse_mode: 'Markdown' }
            );

            return { success: true, message: 'Telegram connection successful' };
        } catch (error) {
            logger.error('Telegram test failed:', error);
            return { success: false, message: error.message };
        }
    }

    async sendMessage(message, options = {}) {
        try {
            if (!this.isConfigured()) {
                return { success: false, message: 'Telegram not configured' };
            }

            const result = await this.bot.telegram.sendMessage(this.chatId, message, {
                parse_mode: 'Markdown',
                disable_web_page_preview: true,
                ...options
            });

            return { success: true, message: 'Message sent', messageId: result.message_id };
        } catch (error) {
            logger.error('Failed to send Telegram message:', error);
            return { success: false, message: error.message };
        }
    }
}

module.exports = new TelegramService();