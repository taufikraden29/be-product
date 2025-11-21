# Auto-Scraping Setup Guide

Project ini sudah dilengkapi dengan sistem auto-scraping realtime setiap 1 menit. Ada dua komponen utama:

1. **Backend Cron Job** - Scraping data dari source
2. **Frontend Auto-Refresh** - Refresh tampilan otomatis

## 📊 Cara Kerja

```
External Cron Service (every 1 min)
    ↓
POST /api/scrape-cron
    ↓
Scrape data dari Himalaya Reload
    ↓
Save ke public/data.json
    ↓
Frontend auto-refresh (every 1 min)
    ↓
Tampilkan data terbaru
```

## 🚀 Setup Backend Cron Job

### Option 1: Vercel Cron (Recommended untuk Vercel)

1. **Deploy ke Vercel**
   ```bash
   vercel deploy
   ```

2. **Setup Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add: `CRON_SECRET` = Generate random string (e.g., `openssl rand -base64 32`)
   - Add: `SCRAPER_URL` = Your scraper source URL
   - Add: `TELEGRAM_BOT_TOKEN` (optional)
   - Add: `TELEGRAM_CHAT_ID` (optional)

3. **Verify Cron Configuration**
   - File `vercel.json` sudah dikonfigurasi:
   ```json
   {
     "crons": [{
       "path": "/api/scrape-cron",
       "schedule": "* * * * *"
     }]
   }
   ```

4. **Test Cron Endpoint**
   ```bash
   curl -X POST https://your-domain.vercel.app/api/scrape-cron \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

### Option 2: Railway Cron (Recommended untuk Railway)

1. **Deploy ke Railway**
   ```bash
   railway up
   ```

2. **Setup Environment Variables**
   - Go to Variables tab
   - Add: `CRON_SECRET` = Generate random string
   - Add: `SCRAPER_URL` = Your scraper source URL
   - Add: `TELEGRAM_BOT_TOKEN` (optional)
   - Add: `TELEGRAM_CHAT_ID` (optional)

3. **Railway Cron sudah dikonfigurasi** di `railway.toml`:
   ```toml
   [[crons]]
   command = "curl -X POST https://$RAILWAY_PUBLIC_DOMAIN/api/scrape-cron -H 'Authorization: Bearer $CRON_SECRET'"
   schedule = "* * * * *"
   ```

### Option 3: External Cron Service (cron-job.org)

Jika deploy di platform yang tidak support cron (seperti shared hosting):

1. **Buat akun di [cron-job.org](https://cron-job.org)**

2. **Buat Cron Job baru:**
   - Title: `Himalaya Scraper Auto-Update`
   - URL: `https://your-domain.com/api/scrape-cron`
   - Schedule: `* * * * *` (every minute)
   - Method: `POST`
   - Headers:
     ```
     Authorization: Bearer YOUR_CRON_SECRET
     ```

3. **Save dan activate**

### Option 4: GitHub Actions

Buat file `.github/workflows/auto-scrape.yml`:

```yaml
name: Auto Scrape Data

on:
  schedule:
    - cron: '* * * * *'  # Every minute
  workflow_dispatch:  # Manual trigger

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Scrape
        run: |
          curl -X POST ${{ secrets.APP_URL }}/api/scrape-cron \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Setup secrets:
- `APP_URL` = Your deployed app URL
- `CRON_SECRET` = Your cron secret

## 🖥️ Frontend Auto-Refresh

Frontend sudah dilengkapi dengan auto-refresh otomatis:

### Fitur:
- ✅ Auto-refresh setiap 60 detik
- ✅ Countdown timer
- ✅ Pause/Resume controls
- ✅ Manual refresh button
- ✅ Status indicator dengan animasi
- ✅ Last update timestamp

### Kontrol UI:
```
┌─────────────────────────┐
│ Auto-Refresh         ● │  ← Status indicator
│ Status: ✅ Active      │
│ Next in: 45s          │
│ Interval: 60s         │
│ [Pause] [Refresh Now] │
└─────────────────────────┘
```

### Customize Interval

Edit `app/page.tsx`:
```typescript
const autoRefresh = useAutoRefresh(fetchProducts, {
  interval: 60000, // Change to desired interval (milliseconds)
  enabled: true,
  onRefresh: () => {
    console.log('✅ Products refreshed')
  }
})
```

## 🔒 Security

### Protect Cron Endpoint

1. **Generate Secret:**
   ```bash
   openssl rand -base64 32
   ```

2. **Set Environment Variable:**
   ```
   CRON_SECRET=your_generated_secret_here
   ```

3. **Update Cron Calls:**
   All cron requests must include:
   ```
   Authorization: Bearer your_generated_secret_here
   ```

## 🧪 Testing

### Test Cron Endpoint Manually:

```bash
# Without auth (will work if CRON_SECRET not set)
curl -X POST http://localhost:3000/api/scrape-cron

# With auth
curl -X POST http://localhost:3000/api/scrape-cron \
  -H "Authorization: Bearer your_secret"
```

### Test Frontend Auto-Refresh:

1. Open browser console
2. Watch for logs:
   ```
   🚀 Auto-refresh enabled - interval: 60s
   🔄 Fetching fresh data...
   ✅ New data received: {products: 2418, ...}
   ```

### Monitor Cron Execution:

**Vercel:**
```bash
vercel logs --follow
```

**Railway:**
```bash
railway logs
```

## 📈 Monitoring

### Check Endpoint Status:
```bash
curl https://your-domain.com/api/scrape-cron
```

Response:
```json
{
  "success": true,
  "message": "Cron endpoint is active",
  "instructions": {...},
  "note": "Send POST request to trigger scraping"
}
```

### Verify Data Updates:
```bash
curl https://your-domain.com/data.json
```

Check `metadata.lastUpdate` timestamp.

## ⚠️ Troubleshooting

### Cron tidak berjalan:
1. Check environment variables (`CRON_SECRET`)
2. Verify cron service is configured correctly
3. Check logs for errors
4. Test endpoint manually

### Frontend tidak update:
1. Check browser console for errors
2. Verify `/data.json` is accessible
3. Check auto-refresh status indicator
4. Try manual refresh button

### Data tidak berubah:
1. Source website mungkin tidak ada perubahan
2. Check scraper logs
3. Verify `SCRAPER_URL` environment variable
4. Test scraper endpoint directly

## 📊 Performance Tips

1. **Adjust Interval**: Ubah dari 1 menit ke interval yang lebih panjang jika tidak perlu realtime
2. **Cache Control**: Browser akan cache `/data.json`, pastikan ada cache busting (`?t=timestamp`)
3. **Optimize Scraping**: Scraper sudah dilengkapi cache, hanya update jika ada perubahan
4. **Monitor Logs**: Pantau untuk error atau excessive requests

## 🔄 Deployment Checklist

- [ ] Environment variables set (CRON_SECRET, SCRAPER_URL)
- [ ] Cron service configured (Vercel/Railway/External)
- [ ] Test cron endpoint manually
- [ ] Verify frontend auto-refresh working
- [ ] Check logs for errors
- [ ] Monitor data updates
- [ ] Setup Telegram notifications (optional)

## 📝 Example Environment Variables

```env
# Scraper
SCRAPER_URL=https://himalayareload.otoreport.com/harga.js.php?id=YOUR_ID

# Security
CRON_SECRET=your_random_secret_32_chars_min

# Telegram (Optional)
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789

# App
NODE_ENV=production
```

---

**✅ Setup Complete!** Data akan otomatis ter-scrape setiap 1 menit dan frontend akan auto-refresh.
