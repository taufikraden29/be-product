# 🎯 Auto-Scraping Realtime - Setup Complete

## ✅ Yang Sudah Dibuat

### 1. Backend API Endpoint
- **File**: `app/api/scrape-cron/route.ts`
- **Endpoint**: `POST /api/scrape-cron`
- **Fungsi**: 
  - Scrape data dari Himalaya Reload
  - Simpan ke `public/data.json`
  - Auto-update setiap 1 menit via cron
- **Security**: Bearer token authentication (CRON_SECRET)

### 2. Frontend Auto-Refresh
- **File**: `hooks/useAutoRefresh.ts`
- **Interval**: 60 detik (1 menit)
- **Features**:
  - ✅ Auto-refresh otomatis
  - ✅ Countdown timer
  - ✅ Pause/Resume controls
  - ✅ Manual refresh button
  - ✅ Visual status indicator
  - ✅ Last update timestamp

### 3. Scraper Service
- **File**: `lib/scraper.ts`
- **Features**:
  - ✅ Smart caching (hanya update jika ada perubahan)
  - ✅ MD5 hash comparison
  - ✅ Error handling with fallback
  - ✅ Data validation
  - ✅ Auto-save to JSON

### 4. Configuration Files
- ✅ `vercel.json` - Vercel Cron setup
- ✅ `railway.toml` - Railway Cron setup
- ✅ `CRON-SETUP.md` - Detailed setup instructions

## 🚀 Cara Menggunakan

### A. Deploy & Setup (Pilih salah satu)

#### Option 1: Vercel (Recommended)
```bash
# 1. Deploy
vercel deploy --prod

# 2. Set environment variables di Vercel dashboard:
CRON_SECRET=your_random_secret_here
SCRAPER_URL=https://himalayareload.otoreport.com/harga.js.php?id=YOUR_ID
TELEGRAM_BOT_TOKEN=your_bot_token (optional)
TELEGRAM_CHAT_ID=your_chat_id (optional)

# 3. Cron akan otomatis berjalan setiap 1 menit
```

#### Option 2: Railway
```bash
# 1. Deploy
railway up

# 2. Set environment variables di Railway:
CRON_SECRET=your_random_secret_here
SCRAPER_URL=https://himalayareload.otoreport.com/harga.js.php?id=YOUR_ID
TELEGRAM_BOT_TOKEN=your_bot_token (optional)
TELEGRAM_CHAT_ID=your_chat_id (optional)

# 3. Railway akan auto-setup cron dari railway.toml
```

#### Option 3: External Cron Service
Gunakan cron-job.org atau similar:
- URL: `https://your-domain.com/api/scrape-cron`
- Method: `POST`
- Schedule: `* * * * *` (every minute)
- Header: `Authorization: Bearer YOUR_CRON_SECRET`

### B. Generate CRON_SECRET
```bash
# Metode 1: OpenSSL
openssl rand -base64 32

# Metode 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Metode 3: Online
# Visit: https://generate-secret.vercel.app/32
```

## 📊 UI Features

### Auto-Refresh Widget (Header kanan atas)
```
┌─────────────────────────┐
│ Auto-Refresh         ● │  ← Green pulsing dot = active
│ Status: ✅ Active      │
│ Next in: 45s          │  ← Countdown real-time
│ Interval: 60s         │
│ [Pause] [Refresh Now] │  ← Controls
└─────────────────────────┘
```

### Features:
1. **Auto-refresh**: Data otomatis reload setiap 60 detik
2. **Visual indicator**: Dot hijau berkedip saat active
3. **Countdown**: Hitung mundur sampai refresh berikutnya
4. **Pause/Resume**: User bisa pause auto-refresh
5. **Manual refresh**: Tombol untuk force refresh kapan saja
6. **Last update**: Timestamp update terakhir di header

## 🔍 Testing

### 1. Test Cron Endpoint (Manual)
```bash
# Development
curl -X POST http://localhost:3000/api/scrape-cron

# Production (dengan auth)
curl -X POST https://your-domain.com/api/scrape-cron \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "message": "Scraping completed and data saved",
  "data": {
    "updated": true,
    "totalProducts": 2418,
    "totalCategories": 45,
    "lastUpdate": "2025-11-21T...",
    "fileSaved": "public/data.json"
  }
}
```

### 2. Test Frontend Auto-Refresh
1. Open app in browser
2. Open Console (F12)
3. Watch for logs:
   ```
   🚀 Auto-refresh enabled - interval: 60s
   🔄 Fetching fresh data...
   📊 Products loaded: {total: 2418, categories: 45, ...}
   ✅ Products refreshed automatically
   ```
4. Check auto-refresh widget (top-right corner)

### 3. Verify Data Updates
```bash
# Check data.json timestamp
curl https://your-domain.com/data.json | jq '.metadata.lastUpdate'
```

## 📈 Monitoring

### View Logs

**Vercel:**
```bash
vercel logs --follow
```

**Railway:**
```bash
railway logs --follow
```

### Check Cron Status
```bash
# GET endpoint info
curl https://your-domain.com/api/scrape-cron
```

### Monitor Data Changes
Watch console logs untuk:
- `✅ Data saved successfully: X products`
- `📝 Data updated: YES/NO`
- `✅ New data received`

## 🎛️ Customization

### Ubah Interval Auto-Refresh

Edit `app/page.tsx`:
```typescript
const autoRefresh = useAutoRefresh(fetchProducts, {
  interval: 30000, // 30 seconds
  enabled: true,
  onRefresh: () => {
    console.log('✅ Refreshed')
  }
})
```

### Ubah Cron Schedule

**Vercel** - Edit `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/scrape-cron",
    "schedule": "*/5 * * * *"  // Every 5 minutes
  }]
}
```

**Railway** - Edit `railway.toml`:
```toml
[[crons]]
command = "curl -X POST https://$RAILWAY_PUBLIC_DOMAIN/api/scrape-cron ..."
schedule = "*/5 * * * *"  # Every 5 minutes
```

## ⚠️ Important Notes

1. **Cron Limits**:
   - Vercel Free: Limited cron executions per month
   - Railway: Check your plan limits
   - External services: Usually have free tier limits

2. **Rate Limiting**:
   - Source website might rate-limit if too frequent
   - Recommend: 1-5 minute intervals maximum

3. **Data Persistence**:
   - `public/data.json` saved on each scrape
   - Frontend reads from this file
   - Changes reflected in real-time

4. **Performance**:
   - Scraper uses MD5 hash comparison
   - Only updates if data actually changed
   - Minimal bandwidth usage

## 🛠️ Troubleshooting

### Cron tidak jalan:
- ✅ Check environment variables (CRON_SECRET)
- ✅ Verify cron configuration in deployment platform
- ✅ Check logs untuk errors
- ✅ Test endpoint manually

### Frontend tidak update:
- ✅ Check browser console untuk errors
- ✅ Verify data.json accessible
- ✅ Check auto-refresh status widget
- ✅ Try manual refresh button

### Data tidak berubah:
- ✅ Source mungkin tidak ada perubahan
- ✅ Check scraper logs
- ✅ Verify SCRAPER_URL valid
- ✅ Test scraper endpoint directly

## 📚 Files Reference

### Backend:
- `app/api/scrape-cron/route.ts` - Cron endpoint
- `lib/scraper.ts` - Scraper service
- `lib/change-detector.ts` - Detect changes

### Frontend:
- `app/page.tsx` - Main page with auto-refresh
- `hooks/useAutoRefresh.ts` - Auto-refresh hook
- `lib/auto-scraper.ts` - Client-side scraper utility

### Config:
- `vercel.json` - Vercel deployment
- `railway.toml` - Railway deployment
- `.env` - Environment variables

### Documentation:
- `CRON-SETUP.md` - Detailed cron setup guide
- `AUTO-SCRAPING-SUMMARY.md` - This file
- `README.md` - General project info

## ✨ Next Steps

1. ✅ Deploy aplikasi ke platform pilihan (Vercel/Railway)
2. ✅ Set environment variables (CRON_SECRET, SCRAPER_URL)
3. ✅ Test cron endpoint manually
4. ✅ Verify auto-refresh di frontend
5. ✅ Monitor logs untuk confirmasidata updates
6. ✅ Setup Telegram notifications (optional)

---

**🎉 Setup Complete!** Data akan otomatis ter-scrape dan update setiap 1 menit.
