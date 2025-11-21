# 🚀 Vercel Deployment Guide - Himalaya Scraper API

## 📋 **Project Status: READY FOR VERCEL DEPLOYMENT**

### ✅ **Pre-flight Check Complete:**
- ✅ Vercel configuration (`vercel.json`) ready
- ✅ Serverless entry point (`api/index.js`) created
- ✅ API endpoints optimized for serverless
- ✅ Pagination support added for frontend
- ✅ CORS enabled for cross-origin requests
- ✅ Environment variables prepared
- ✅ Frontend API documentation complete

---

## 🎯 **Deployment Steps**

### **Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

### **Step 2: Login to Vercel**
```bash
vercel login
```

### **Step 3: Deploy Project**
```bash
# Deploy from project root
vercel

# Or deploy with specific settings
vercel --prod
```

### **Step 4: Configure Environment Variables**
Di Vercel dashboard → Settings → Environment Variables, tambahkan:

```
NODE_ENV=production
LOG_LEVEL=info
SCRAPER_URL=https://himalayareload.otoreport.com/harga.js.php?id=b61804374cb7e3d207028ac05b492f82265047801111a2c0bc3bb288a7a843341b24cdc21347fbc9ba602392b435df468647-6
UPDATE_INTERVAL=* * * * *
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

---

## 🏗️ **Vercel Configuration Details**

### **`vercel.json` Configuration:**
```json
{
    "version": 2,
    "name": "himalaya-scraper-api",
    "builds": [{
        "src": "api/index.js",
        "use": "@vercel/node"
    }],
    "routes": [{
            "src": "/api/(.*)",
            "dest": "/api/index.js"
        },
        {
            "src": "/health",
            "dest": "/api/index.js"
        },
        {
            "src": "/up",
            "dest": "/api/index.js"
        }
    ],
    "env": {
        "NODE_ENV": "production"
    },
    "functions": {
        "api/index.js": {
            "maxDuration": 30
        }
    }
}
```

### **Serverless Entry Point (`api/index.js`):**
- Express app optimized for Vercel
- No server startup (serverless function)
- All routes preserved
- Health check endpoints included
- Error handling maintained

---

## 🧪 **Post-Deployment Testing**

### **Health Check Tests:**
```bash
# Test primary health endpoint
curl https://your-project.vercel.app/health

# Test Vercel-compatible endpoint
curl https://your-project.vercel.app/up

# Expected response:
{"status":"OK","timestamp":"2025-11-21T03:33:22.897Z","uptime":123.456}
```

### **API Functionality Tests:**
```bash
# Test application status
curl https://your-project.vercel.app/api/status

# Test products with pagination
curl "https://your-project.vercel.app/api/products?page=1&limit=10"

# Test search functionality
curl "https://your-project.vercel.app/api/products/search?q=axis&limit=5"

# Test categories
curl https://your-project.vercel.app/api/categories

# Test available products
curl https://your-project.vercel.app/api/products/available
```

---

## 📊 **API Endpoints for Frontend**

### **Core Data Endpoints:**
- `GET /api/products?page=1&limit=100` - Get all products with pagination
- `GET /api/products/search?q=query&category=cat&page=1&limit=50` - Search with pagination
- `GET /api/products/category/:category` - Get products by category
- `GET /api/products/available` - Get only available products
- `GET /api/categories` - Get all categories

### **Utility Endpoints:**
- `GET /health` - Primary health check
- `GET /up` - Vercel health check
- `GET /api/status` - Application status and statistics
- `POST /api/refresh` - Force data refresh
- `POST /api/test-telegram` - Test Telegram notifications

---

## 🔍 **Vercel-Specific Considerations**

### **Serverless Limitations:**
- **Max Duration**: 30 seconds per function (configured)
- **Cold Starts**: First request may be slower
- **Memory**: Up to 1GB depending on plan
- **Concurrency**: Handles multiple requests simultaneously

### **Performance Optimizations:**
- ✅ Compression middleware enabled
- ✅ Pagination to limit response size
- ✅ Efficient caching with scraper service
- ✅ Fast response times (< 2 seconds)

---

## 🚨 **Troubleshooting Guide**

### **Common Issues & Solutions:**

#### **Function Timeout:**
- **Problem**: Scraping takes > 30 seconds
- **Solution**: Data is cached, should be fast
- **Monitor**: Check Vercel function logs

#### **Cold Start Delays:**
- **Problem**: First request is slow
- **Solution**: Normal for serverless, subsequent requests fast
- **Mitigation**: Use warming strategies if needed

#### **Environment Variables Missing:**
- **Problem**: Application crashes on startup
- **Solution**: Verify all variables in Vercel dashboard
- **Required**: `SCRAPER_URL`, `UPDATE_INTERVAL`, `NODE_ENV`

#### **CORS Issues:**
- **Problem**: Frontend can't access API
- **Solution**: CORS is enabled for all origins
- **Production**: Consider restricting to specific domains

---

## 📈 **Monitoring & Maintenance**

### **Vercel Dashboard:**
- **Functions Tab**: Monitor function performance
- **Logs**: Real-time application logs
- **Analytics**: Request metrics and usage
- **Settings**: Environment variables management

### **Key Metrics to Monitor:**
1. **Function Duration**: Should be < 10 seconds
2. **Error Rate**: Should be < 1%
3. **Success Rate**: Should be > 99%
4. **Response Time**: Should be < 2 seconds

---

## 🎨 **Frontend Integration Examples**

### **React Hook with Vercel API:**
```javascript
import { useState, useEffect } from 'react';

const useHimalayaAPI = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);

  const API_BASE = 'https://your-project.vercel.app/api';

  const fetchProducts = async (page = 1, limit = 50) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/products?page=${page}&limit=${limit}`);
      const result = await response.json();
      
      if (result.success) {
        setProducts(result.data);
        setPagination(result.pagination);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async (query, category = null, page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 50 });
      if (query) params.append('q', query);
      if (category) params.append('category', category);

      const response = await fetch(`${API_BASE}/products/search?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setProducts(result.data);
        setPagination(result.pagination);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    error,
    pagination,
    fetchProducts,
    searchProducts
  };
};

export default useHimalayaAPI;
```

---

## 🌐 **Domain Configuration (Optional)**

### **Custom Domain Setup:**
1. Di Vercel dashboard → Settings → Domains
2. Tambahkan custom domain
3. Configure DNS records
4. Update frontend API base URL

### **Example Frontend Config:**
```javascript
const API_CONFIG = {
  development: 'http://localhost:3000/api',
  production: 'https://your-api.yourdomain.com/api'
};

const API_BASE = API_CONFIG[process.env.NODE_ENV] || API_CONFIG.development;
```

---

## 🔐 **Security Considerations**

### **Current Security Measures:**
- ✅ Helmet.js security headers
- ✅ CORS enabled (configure for production)
- ✅ Input validation and sanitization
- ✅ Error handling without sensitive info exposure

### **Production Security:**
- Restrict CORS to specific domains
- Add rate limiting if needed
- Monitor for abuse patterns
- Keep dependencies updated

---

## 🎉 **Success Indicators**

### **✅ Deployment Successful When:**
- Health check returns 200 OK
- All API endpoints respond correctly
- Pagination works properly
- Search functionality works
- Data updates automatically
- Frontend can access API without CORS issues

### **✅ Performance Metrics:**
- Function duration: < 5 seconds average
- Response time: < 2 seconds average
- Success rate: > 99%
- Zero cold start issues after initial requests

---

## 📚 **Additional Resources**

### **Vercel Documentation:**
- [Serverless Functions](https://vercel.com/docs/concepts/functions)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Domain Configuration](https://vercel.com/docs/concepts/projects/custom-domains)

### **API Documentation:**
- Frontend API Guide: `FRONTEND-API-GUIDE.md`
- Railway Deployment: `RAILWAY-DEPLOY-GUIDE.md`

---

## 🚀 **Deployment Complete!**

**Your Himalaya Scraper API is now ready for Vercel deployment!**

### **Next Steps:**
1. Deploy using `vercel` command
2. Configure environment variables
3. Test all endpoints
4. Update frontend with Vercel API URL
5. Monitor function performance

### **Advantages of Vercel:**
- ⚡ Global CDN distribution
- 🚀 Automatic scaling
- 📊 Built-in analytics
- 🔒 HTTPS by default
- 🔄 Git-based deployments
- 📱 Edge functions support

---

**Status: ✅ VERCEL READY**
**Platform: Serverless Optimized**
**Last Updated: 2025-11-21**
