# 🚀 Deploy ke Railway

## 📋 Checklist Sebelum Deploy

✅ **API Testing**
- Health check: ✅ Working
- Products endpoint: ✅ Working  
- Telegram notifications: ✅ Working
- Scheduler: ✅ Running setiap menit

✅ **Configuration**
- Railway.toml: ✅ Ready
- Environment variables: ✅ Configured
- Dependencies: ✅ All installed

## 🔥 Cara Deploy

### Metode 1: GitHub (Recommended)

1. **Push ke GitHub**
```bash
git add .
git commit -m "Production ready - Himalaya Scraper API"
git push origin main
```

2. **Deploy via Railway**
- Buka [railway.app](https://railway.app)
- Login / Sign up
- Click "New Project"
- Pilih "Deploy from GitHub repo"
- Pilih repository ini
- Railway akan otomatis deploy

### Metode 2: Railway CLI

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login**
```bash
railway login
```

3. **Deploy**
```bash
railway up
```

## ⚙️ Environment Variables di Railway

Set di Railway dashboard → Settings → Variables:

**WAJIB:**
```
NODE_ENV=production
LOG_LEVEL=info
SCRAPER_URL=https://himalayareload.otoreport.com/harga.js.php?id=b61804374cb7e3d207028ac05b492f82265047801111a2c0bc3bb288a7a843341b24cdc21347fbc9ba602392b435df468647-6
UPDATE_INTERVAL=* * * * *
```

**TELEGRAM (jika mau notifikasi):**
```
TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN
TELEGRAM_CHAT_ID=YOUR_CHAT_ID
```

## 🌐 Setelah Deploy

### URL Aplikasi
```
https://<nama-projek>.railway.app
```

### API Endpoints
```
GET  /health                    - Health check
GET  /api/products              - Semua produk
GET  /api/products/category/:cat   - Produk per kategori
GET  /api/products/search?q=...   - Search produk
GET  /api/products/available      - Produk tersedia
GET  /api/categories             - Semua kategori
POST /api/refresh                - Force refresh
POST /api/test-telegram          - Test Telegram
GET  /api/status                 - Status sistem
```

## 🧪 Testing Production

### Health Check
```bash
curl https://<nama-projek>.railway.app/health
```

### Test Products
```bash
curl https://<nama-projek>.railway.app/api/products | head -c 200
```

### Test Telegram
```bash
curl -X POST https://<nama-projek>.railway.app/api/test-telegram
```

## 📊 Monitoring

### Railway Dashboard
- Logs: View real-time logs
- Metrics: CPU, Memory, Usage
- Build logs: Deploy status
- Environment: Variables management

### API Monitoring
```bash
# Status check
curl https://<nama-projek>.railway.app/api/status

# Watch logs (jika install Railway CLI)
railway logs
```

## 🔧 Troubleshooting

### Common Issues & Solutions

1. **Bot tidak menerima notifikasi**
   - Pastikan `TELEGRAM_BOT_TOKEN` dan `TELEGRAM_CHAT_ID` benar
   - Test dengan `/api/test-telegram`
   - Start ulang bot Telegram: `/start`

2. **Data tidak ter-update**
   - Cek URL scraper masih valid
   - Monitor logs di Railway dashboard
   - Manual refresh: `POST /api/refresh`

3. **High memory usage**
   - Restart aplikasi di Railway dashboard
   - Monitor usage metrics
   - Scale up jika perlu

4. **Rate limiting dari source**
   - Ubah interval update: `UPDATE_INTERVAL=0 */5 * * * *`
   - Monitor error logs

## 📈 Performance Tips

### Di Production
- Monitor logs size
- Set alerts untuk error
- Use Railway metrics dashboard
- Implement caching di client

### Optimasi
- Data cached di memory (fast)
- Scheduler yang efisien
- Error handling yang baik
- Health check untuk monitoring

## ✅ Deploy Selesai!

Setelah semua langkah di atas, aplikasi akan:
- ✅ Auto-scraping setiap menit
- ✅ Notifikasi Telegram untuk perubahan
- ✅ RESTful API yang responsive
- ✅ Monitoring dan logging
- ✅ Production-ready

**Selamat menggunakan Himalaya Scraper API! 🎉**

---

*Created for Railway deployment*
*Production ready*
*Telegram notifications enabled*
