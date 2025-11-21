# 🚀 Railway Deployment Guide - Himalaya Scraper API

## 📋 **Project Status: READY FOR DEPLOYMENT**

### ✅ **Pre-flight Check Complete:**
- ✅ Application runs locally (port 3000)
- ✅ Health check endpoints working (`/health`, `/up`)
- ✅ API endpoints functional (`/api/status`)
- ✅ Scheduler running with 2418+ products indexed
- ✅ Auto-updating every minute
- ✅ Railway configuration optimized
- ✅ Environment variables ready

---

## 🎯 **Deployment Steps**

### **Step 1: Final Git Commit**
```bash
git add .
git commit -m "Project ready for Railway deployment - all systems operational"
git push origin main
```

### **Step 2: Deploy to Railway**
1. Buka [railway.app](https://railway.app)
2. Login dengan GitHub
3. Klik **"New Project"**
4. Pilih **"Deploy from GitHub"**
5. Cari repository `be-product`
6. Klik **"Deploy Now"**

### **Step 3: Configure Environment Variables**
Di Railway dashboard → Settings → Variables, tambahkan:

```
NODE_ENV=production
LOG_LEVEL=info
SCRAPER_URL=https://himalayareload.otoreport.com/harga.js.php?id=b61804374cb7e3d207028ac05b492f82265047801111a2c0bc3bb288a7a843341b24cdc21347fbc9ba602392b435df468647-6
UPDATE_INTERVAL=* * * * *
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

---

## 🧪 **Post-Deployment Testing**

### **Health Check Tests:**
```bash
# Test primary health endpoint
curl https://<your-project-name>.railway.app/health

# Test Railway-compatible endpoint
curl https://<your-project-name>.railway.app/up

# Expected response:
{"status":"OK","timestamp":"2025-11-21T03:33:22.897Z","uptime":123.456}
```

### **API Functionality Tests:**
```bash
# Test application status
curl https://<your-project-name>.railway.app/api/status

# Expected response:
{"success":true,"data":{"scheduler":{"isRunning":true,"interval":"* * * * *","cacheInfo":{"hasData":true,"lastUpdate":"2025-11-21T03:26:22.125Z","lastFetch":"2025-11-21T03:33:00.343Z","dataCount":2418}},"cache":{"hasData":true,"lastUpdate":"2025-11-21T03:26:22.125Z","lastFetch":"2025-11-21T03:33:00.343Z","dataCount":2418},"timestamp":"2025-11-21T03:33:25.867Z"}}

# Test products endpoint
curl https://<your-project-name>.railway.app/api/products | head -c 200

# Test search functionality
curl "https://<your-project-name>.railway.app/api/search?q=axis"
```

---

## 📊 **Railway Configuration Details**

### **Current Configuration (`railway.toml`):**
```toml
[build]
builder = "NIXPACKS"

[build.env]
NPM_CONFIG_PRODUCTION = "false"

[deploy]
healthcheckPath = "/health"
healthcheckTimeout = 10000
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10

[[services]]
name = "himalaya-scraper-api"
```

### **Package.json Configuration:**
```json
{
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## 🔍 **Monitoring & Maintenance**

### **Railway Dashboard Monitoring:**
- **Logs**: Real-time application logs
- **Metrics**: CPU, Memory, Network usage
- **Health Checks**: Automatic every 30 seconds
- **Build Logs**: Deployment status and errors

### **Key Metrics to Monitor:**
1. **Health Check Success Rate**: Should be 100%
2. **Uptime**: Application should stay online
3. **Scheduler Status**: Auto-update every minute
4. **Data Count**: Should maintain ~2400+ products
5. **Response Time**: API calls should be < 2 seconds

---

## 🚨 **Troubleshooting Guide**

### **Common Issues & Solutions:**

#### **Health Check Fails:**
- **Problem**: Health check timeout or error
- **Solution**: Check logs, verify server startup time < 10 seconds
- **Command**: Monitor Railway build logs

#### **Environment Variables Missing:**
- **Problem**: Application crashes on startup
- **Solution**: Verify all required variables are set in Railway dashboard
- **Required**: `NODE_ENV`, `SCRAPER_URL`, `UPDATE_INTERVAL`

#### **Scheduler Not Running:**
- **Problem**: Data not updating automatically
- **Solution**: Check `UPDATE_INTERVAL` format (must be 5-part cron)
- **Default**: Use `* * * * *` for every minute

#### **Telegram Notifications Not Working:**
- **Problem**: No Telegram alerts for changes
- **Solution**: Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`
- **Test**: Use `/api/test-telegram` endpoint

---

## 📈 **Performance Optimization**

### **Current Optimizations:**
- ✅ Compression middleware enabled
- ✅ Helmet security headers
- ✅ CORS properly configured
- ✅ Request logging with Winston
- ✅ Error handling implemented
- ✅ Health checks optimized

### **Production Best Practices:**
1. **Monitor memory usage**: Railway provides 512MB-1GB depending on plan
2. **Log rotation**: Winston handles log management
3. **Error tracking**: All errors logged centrally
4. **Cache efficiency**: Data cached and updated efficiently

---

## 🎉 **Success Indicators**

### **✅ Deployment Successful When:**
- Health check shows green status in Railway
- All API endpoints return proper responses
- Scheduler is running and updating data
- Telegram notifications work (if configured)
- Application logs show no critical errors

### **✅ Application Features Working:**
- 2418+ products indexed and searchable
- Auto-update every minute
- Change detection and notifications
- RESTful API with 9 endpoints
- Production-ready error handling

---

## 📚 **API Endpoints Reference**

### **Health & Status:**
- `GET /health` - Primary health check
- `GET /up` - Railway-compatible health check
- `GET /api/status` - Application status and statistics

### **Data Operations:**
- `GET /api/products` - Get all products
- `GET /api/search?q=query` - Search products
- `GET /api/categories` - Get categories
- `GET /api/brands` - Get brands

### **Utilities:**
- `POST /api/test-telegram` - Test Telegram notifications
- `GET /api/refresh` - Force data refresh
- `GET /api/stats` - Detailed statistics

---

## 🚀 **Deployment Complete!**

**Your Himalaya Scraper API is now ready for production on Railway!**

### **Next Steps:**
1. Deploy following the steps above
2. Monitor initial deployment logs
3. Test all endpoints
4. Set up monitoring alerts
5. Configure Telegram notifications

### **Support:**
- Check Railway logs for any issues
- Review this guide for troubleshooting
- Monitor `/api/status` for system health

---

**Status: ✅ PRODUCTION READY**
**Platform: Railway Optimized**
**Last Updated: 2025-11-21**
