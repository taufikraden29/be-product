# Himalaya Scraper Next.js

Full-stack Next.js aplikasi untuk scraping data produk dari Himalaya Reload dengan **auto-scraping realtime setiap 1 menit** dan frontend yang auto-refresh.

## 🚀 Fitur Utama

### Backend:
- ✅ **Auto Scraping Realtime**: Data di-scrape otomatis setiap 1 menit via cron
- ✅ **Smart Caching**: MD5 hash comparison, hanya update jika ada perubahan
- ✅ **Telegram Notifications**: Notifikasi perubahan harga/status
- ✅ **RESTful API**: Multiple endpoints untuk data access
- ✅ **Change Detection**: Deteksi dan log semua perubahan
- ✅ **Error Handling**: Robust error handling dengan fallback

### Frontend:
- ✅ **Auto-Refresh**: Frontend auto-refresh setiap 60 detik
- ✅ **Real-time Updates**: Data selalu sinkron dengan backend
- ✅ **Visual Indicators**: Status widget dengan countdown timer
- ✅ **Manual Controls**: Pause/Resume dan Force Refresh
- ✅ **Data Analysis**: Built-in analysis dashboard
- ✅ **Responsive UI**: Modern, clean interface with Tailwind CSS

## 📋 API Endpoints

### Produk
- `GET /api/products` - Mendapatkan semua produk
- `GET /api/live-scraper` - Live scrape data dari source
- `GET /api/analysis` - Analisis data komprehensif
- `GET /data.json` - Data JSON statis (auto-updated)

### Auto-Scraping (Cron)
- `POST /api/scrape-cron` - Trigger auto-scraping (untuk cron jobs)
- `GET /api/scrape-cron` - Info endpoint dan setup instructions

### Utility
- `POST /api/telegram-test` - Test notifikasi Telegram
- `GET /api/status` - Status scraper
- `POST /api/changes` - Detect changes manually

### Response Format
```json
{
  "success": true,
  "data": [...],
  "metadata": {
    "lastUpdate": "2025-11-21T02:46:00.384Z",
    "totalProducts": 2418
  }
}
```

## 🛠️ Teknologi

### Backend:
- **Next.js 15** - Full-stack React Framework with App Router
- **TypeScript** - Type-safe development
- **Cheerio** - Fast HTML parsing
- **Axios** - HTTP client untuk scraping

### Frontend:
- **React 19** - Latest React version
- **Tailwind CSS** - Utility-first CSS
- **Custom Hooks** - useAutoRefresh untuk realtime updates

### Deployment:
- **Vercel** - Recommended (dengan Vercel Cron)
- **Railway** - Alternative (dengan Railway Cron)
- **External Cron** - cron-job.org atau similar

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env dengan konfigurasi Anda

# Run development server
npm run dev

# Open browser
# http://localhost:3000
```

### Test Auto-Scraping (Local)

```bash
# Test scrape endpoint
curl -X POST http://localhost:3000/api/scrape-cron

# Check hasil
curl http://localhost:3000/data.json | grep lastUpdate
```

## 📦 Deployment

### 1. Persiapan

```bash
# Clone repository
git clone <repository-url>
cd himalaya-scraper-api

# Install dependencies
npm install

# Setup environment variables untuk Railway
# Telegram (opsional, untuk notifikasi)
TELEGRAM_BOT_TOKEN="bot_token_anda"
TELEGRAM_CHAT_ID="chat_id_anda"
```

### 2. Deploy ke Railway

#### Metode 1: GitHub Integration
1. Push kode ke GitHub repository
2. Connect Railway ke GitHub
3. Pilih repository dan deploy

#### Metode 2: Railway CLI
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login ke Railway
railway login

# Deploy project
railway up
```

### 3. Environment Variables

Set variabel berikut di dashboard platform Anda:

**Wajib:**
- `NODE_ENV` = `production`
- `SCRAPER_URL` = URL sumber data Himalaya Reload
- `CRON_SECRET` = Generate dengan: `openssl rand -base64 32`

**Opsional (untuk Telegram):**
- `TELEGRAM_BOT_TOKEN` = Token bot dari @BotFather
- `TELEGRAM_CHAT_ID` = Chat ID tujuan notifikasi

### 4. Setup Auto-Scraping (PENTING!)

**File sudah dikonfigurasi untuk auto-scraping:**
- ✅ `vercel.json` - Vercel Cron (setiap 1 menit)
- ✅ `railway.toml` - Railway Cron (setiap 1 menit)

**Vercel:**
Cron otomatis jalan setelah deploy. Verifikasi di Vercel Dashboard → Cron Jobs.

**Railway:**
Cron otomatis jalan dari `railway.toml` configuration.

**External Cron (jika perlu):**
Setup di cron-job.org:
- URL: `https://your-domain.com/api/scrape-cron`
- Method: `POST`
- Schedule: `* * * * *`
- Header: `Authorization: Bearer YOUR_CRON_SECRET`

📖 **Dokumentasi lengkap**: Lihat `CRON-SETUP.md`

### 5. Setup Bot Telegram (Opsional)

1. Buat bot di [@BotFather](https://t.me/BotFather)
2. Dapatkan token bot
3. Get Chat ID dari [@userinfobot](https://t.me/userinfobot)
4. Set `TELEGRAM_BOT_TOKEN` dan `TELEGRAM_CHAT_ID`
5. Test di frontend: Menu "Settings" → Send Test Message

## 📊 Format Data Produk

```json
{
  "category": "XL DATA COMBO",
  "code": "XDC1",
  "description": "DATA XL COMBO 1GB + 2GB YTB 30Hr 24Jam+10Mnt All",
  "price": 51.350,
  "status": {
    "text": "Open",
    "available": true,
    "status": "open"
  }
}
```

## 🔧 Konfigurasi

### Local Development
```bash
# Copy environment file
cp .env.example .env

# Edit .env sesuai kebutuhan
nano .env

# Jalankan aplikasi
npm start
```

### Production Environment
Variabel environment otomatis di-set oleh Railway:
- `PORT` - Port yang digunakan (otomatis)
- `NODE_ENV` - Environment mode

### Scheduler Configuration
- Interval: `* * * * *` (setiap menit)
- Auto-detect perubahan: Harga dan status
- Notifikasi: Kirim ke Telegram jika ada perubahan

## 📝 Log Format

Aplikasi menggunakan structured logging dengan format:
```json
{
  "level": "info",
  "message": "Data updated successfully",
  "service": "himalaya-scraper",
  "timestamp": "2025-11-21T02:46:00.384Z"
}
```

## 🔍 Monitoring

### Health Check
```bash
curl https://<your-app-url>.railway.app/health
```

### API Status
```bash
curl https://<your-app-url>.railway.app/api/status
```

### Test Telegram
```bash
curl -X POST https://<your-app-url>.railway.app/api/test-telegram
```

## 🚨 Troubleshooting

### Common Issues

1. **Bot tidak mengirim notifikasi**
   - Pastikan `TELEGRAM_BOT_TOKEN` dan `TELEGRAM_CHAT_ID` sudah di-set
   - Test dengan endpoint `/api/test-telegram`

2. **Data tidak ter-update**
   - Cek log di Railway dashboard
   - Pastikan `SCRAPER_URL` valid dan accessible

3. **Memory usage tinggi**
   - Data disimpan di memory, restart jika perlu
   - Monitor di Railway dashboard

4. **Rate limiting**
   - Scraping setiap menit mungkin menyebabkan rate limiting
   - Sesuaikan interval jika perlu

### Performance Tips

- Gunakan endpoint `/api/products/available` untuk data yang difilter
- Cache response di client side
- Implement pagination untuk data besar
- Monitor log size

## 📄 License

MIT License - Bebas digunakan dan dimodifikasi

## 🤝 Kontribusi

1. Fork repository
2. Buat feature branch
3. Commit perubahan
4. Push dan buat Pull Request

---

**Made with ❤️ for Himalaya Reload Community**
