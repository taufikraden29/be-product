const TelegramBot = require('node-telegram-bot-api');
const { logger } = require('../utils/logger');

class TelegramService {
    constructor() {
        this.bot = null;
        this.chatId = process.env.TELEGRAM_CHAT_ID || '7262989817';
        this.botToken = process.env.TELEGRAM_BOT_TOKEN || '8513247780:AAFHZTyPTr6n4mSqP5UkbDJlbTDgAzs5S3o';
        this.enabled = !!(this.botToken && this.chatId);

        if (this.enabled) {
            this.bot = new TelegramBot(this.botToken, { polling: false });
            logger.info('Telegram notifications enabled');
        } else {
            logger.warn('Telegram notifications disabled - missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
        }
    }

    async sendMessage(message) {
        if (!this.enabled) {
            logger.debug('Telegram not enabled, skipping notification');
            return false;
        }

        try {
            await this.bot.sendMessage(this.chatId, message, {
                parse_mode: 'HTML',
                disable_web_page_preview: true
            });

            logger.info('Telegram notification sent successfully');
            return true;
        } catch (error) {
            logger.error('Failed to send Telegram notification:', error.message);
            return false;
        }
    }

    async notifyDataChanges(changes) {
        if (!this.enabled || !changes || changes.length === 0) {
            return false;
        }

        const message = this.formatChangesMessage(changes);
        return await this.sendMessage(message);
    }

    formatChangesMessage(changes) {
        const timestamp = new Date().toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        let message = `🔄 <b>PERUBAHAN DATA PRODUK</b> 🔄\n\n`;
        message += `📅 <i>${timestamp}</i>\n\n`;

        changes.forEach((change, index) => {
            message += `<b>📦 Produk ${index + 1}:</b>\n`;
            message += `🔹 Kode: <code>${change.code}</code>\n`;
            message += `🔹 Kategori: <b>${change.category}</b>\n`;

            if (change.priceChange) {
                const priceChangeType = change.priceChange.type === 'increase' ? '📈 Naik' : '📉 Turun';
                message += `🔹 Harga: ${priceChangeType}\n`;
                message += `   Dari: <s>Rp ${change.priceChange.old.toLocaleString('id-ID')}</s>\n`;
                message += `   Menjadi: <b>Rp ${change.priceChange.new.toLocaleString('id-ID')}</b>\n`;
                message += `   Selisih: ${priceChangeType === '📈 Naik' ? '+' : ''}Rp ${Math.abs(change.priceChange.difference).toLocaleString('id-ID')}\n`;
            } else {
                message += `🔹 Harga: <b>Rp ${change.price.toLocaleString('id-ID')}</b>\n`;
            }

            if (change.statusChange) {
                const statusIcon = change.statusChange.new.available ? '✅' : '❌';
                message += `🔹 Status: ${statusIcon} <b>${change.statusChange.new.text}</b>\n`;
                message += `   Sebelumnya: ${change.statusChange.old.text}\n`;
            } else {
                const statusIcon = change.status.available ? '✅' : '❌';
                message += `🔹 Status: ${statusIcon} <b>${change.status.text}</b>\n`;
            }

            message += `\n`;
        });

        message += `📊 Total perubahan: <b>${changes.length}</b> produk\n\n`;
        message += `<i>Data diperbarui otomatis setiap menit</i>\n`;
        message += `🔗 <a href="${process.env.SCRAPER_URL}">Lihat sumber data</a>`;

        return message;
    }

    async testConnection() {
        if (!this.enabled) {
            return { success: false, message: 'Telegram not configured' };
        }

        try {
            const testMessage = '🤖 <b>TEST NOTIFIKASI</b> 🤖\n\nBot notifikasi sudah aktif dan siap mengirim perubahan data produk!';
            await this.bot.sendMessage(this.chatId, testMessage, { parse_mode: 'HTML' });
            return { success: true, message: 'Test notification sent successfully' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    isEnabled() {
        return this.enabled;
    }
}

module.exports = new TelegramService();
