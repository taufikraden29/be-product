# Himalaya Scraper API

Backend API untuk scraping data produk dari Himalaya Reload dengan auto-update setiap menit dan notifikasi Telegram untuk perubahan data.

## 🚀 Fitur

- **Auto Scraping**: Mengambil data dari source setiap menit
- **Change Detection**: Mendeteksi perubahan harga dan status produk
- **Telegram Notifications**: Mengirim notifikasi ketika ada perubahan data
- **RESTful API**: Menyediakan endpoint untuk mengakses data
- **Caching**: Menyimpan data di memory untuk performa lebih baik
- **Error Handling**: Menangani error dengan logging yang baik
- **Health Check**: Endpoint untuk monitoring status aplikasi

## 📋 API Endpoints

### Produk
- `GET /api/products` - Mendapatkan semua produk
- `GET /api/products/category/:category` - Mendapatkan produk per kategori
- `GET /api/products/search?q=query&category=cat` - Mencari produk
- `GET /api/products/available` - Mendapatkan produk yang tersedia saja

### Utility
- `GET /api/categories` - Mendapatkan semua kategori
- `POST /api/refresh` - Manual refresh data
- `POST /api/test-telegram` - Test notifikasi Telegram
- `GET /api/status` - Status scraper dan scheduler
- `GET /health` - Health check

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

- **Node.js** - Runtime JavaScript
- **Express.js** - Web Framework
- **Cheerio** - HTML Parsing
- **Axios** - HTTP Client
- **node-cron** - Task Scheduler
- **Winston** - Logging
- **node-telegram-bot-api** - Telegram Integration

## 📦 Deployment ke Railway

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

### 3. Environment Variables di Railway

Set variabel berikut di Railway dashboard:

**Wajib:**
- `NODE_ENV` = `production`
- `SCRAPER_URL` = `https://himalayareload.otoreport.com/harga.js.php?id=b61804374cb7e3d207028ac05b492f82265047801111a2c0bc3bb288a7a843341b24cdc21347fbc9ba602392b435df468647-6`
- `UPDATE_INTERVAL` = `* * * * *`
- `LOG_LEVEL` = `info`

**Opsional (untuk Telegram):**
- `TELEGRAM_BOT_TOKEN` = Token bot dari @BotFather
- `TELEGRAM_CHAT_ID` = Chat ID tujuan notifikasi

### 4. Cara Setup Bot Telegram

1. Buat bot baru di [@BotFather](https://t.me/BotFather)
2. Dapatkan token bot
3. Mulai chat dengan bot baru
4. Forward pesan dari bot ke [@userinfobot](https://t.me/userinfobot) untuk dapatkan Chat ID
5. Set `TELEGRAM_BOT_TOKEN` dan `TELEGRAM_CHAT_ID` di Railway

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
