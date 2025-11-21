# 🌐 Frontend API Guide - Himalaya Scraper API

## 📋 **API Overview**

API ini menyediakan data produk Himalaya Reload yang ter-update otomatis setiap menit. Frontend dapat mengakses semua data melalui RESTful API endpoints yang sudah disiapkan.

## 🏗️ **Data Structure**

### **Product Object Structure:**
```json
{
  "category": "PULSA REGULER",
  "code": "AX5",
  "description": "AXIS 5.000",
  "price": 5500,
  "status": {
    "text": "Open",
    "available": true,
    "status": "open"
  }
}
```

### **Response Structure:**
```json
{
  "success": true,
  "data": [...],
  "metadata": {
    "lastUpdate": "2025-11-21T03:33:00.343Z",
    "lastFetch": "2025-11-21T03:33:00.343Z",
    "totalProducts": 2418
  }
}
```

---

## 🚀 **Available Endpoints for Frontend**

### **1. Get All Products**
```http
GET /api/products
```

**Response:** Array semua produk (2418+ items)

**Frontend Usage:**
```javascript
const fetchProducts = async () => {
  try {
    const response = await fetch('https://your-api.railway.app/api/products');
    const result = await response.json();
    
    if (result.success) {
      setProducts(result.data);
      setLastUpdate(result.metadata.lastUpdate);
      setTotalCount(result.metadata.totalProducts);
    }
  } catch (error) {
    console.error('Error fetching products:', error);
  }
};
```

---

### **2. Search Products**
```http
GET /api/products/search?q=query&category=category
```

**Parameters:**
- `q` (optional): Search query (searches in code & description)
- `category` (optional): Filter by category

**Frontend Usage:**
```javascript
const searchProducts = async (query, category = null) => {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  if (category) params.append('category', category);
  
  const response = await fetch(
    `https://your-api.railway.app/api/products/search?${params}`
  );
  const result = await response.json();
  
  return result.success ? result.data : [];
};

// Example: Search "axis" products
const axisProducts = await searchProducts('axis');

// Example: Search "5000" in "PULSA REGULER" category
const pulsa5000 = await searchProducts('5000', 'PULSA REGULER');
```

---

### **3. Get Products by Category**
```http
GET /api/products/category/:category
```

**Frontend Usage:**
```javascript
const getProductsByCategory = async (category) => {
  const response = await fetch(
    `https://your-api.railway.app/api/products/category/${encodeURIComponent(category)}`
  );
  const result = await response.json();
  
  return result.success ? result.data : [];
};

// Example: Get all pulsa products
const pulsaProducts = await getProductsByCategory('PULSA REGULER');
```

---

### **4. Get Available Products Only**
```http
GET /api/products/available
```

**Frontend Usage:**
```javascript
const getAvailableProducts = async () => {
  const response = await fetch('https://your-api.railway.app/api/products/available');
  const result = await response.json();
  
  if (result.success) {
    setAvailableProducts(result.data);
    setAvailableCount(result.metadata.totalProducts);
    setUnavailableCount(result.metadata.unavailableProducts);
  }
};
```

---

### **5. Get All Categories**
```http
GET /api/categories
```

**Frontend Usage:**
```javascript
const getCategories = async () => {
  const response = await fetch('https://your-api.railway.app/api/categories');
  const result = await response.json();
  
  return result.success ? result.data : [];
};

// Example: Populate category dropdown
const categories = await getCategories();
categories.forEach(category => {
  addOptionToDropdown(category);
});
```

---

### **6. Get API Status**
```http
GET /api/status
```

**Frontend Usage:**
```javascript
const getApiStatus = async () => {
  const response = await fetch('https://your-api.railway.app/api/status');
  const result = await response.json();
  
  if (result.success) {
    setSchedulerStatus(result.data.scheduler.isRunning);
    setLastUpdate(result.data.cache.lastUpdate);
    setTotalProducts(result.data.cache.dataCount);
  }
};
```

---

### **7. Force Data Refresh**
```http
POST /api/refresh
```

**Frontend Usage:**
```javascript
const refreshData = async () => {
  try {
    const response = await fetch('https://your-api.railway.app/api/refresh', {
      method: 'POST'
    });
    const result = await response.json();
    
    if (result.success) {
      showNotification(
        result.metadata.updated ? 'Data updated!' : 'No changes detected',
        'success'
      );
      // Refresh product list
      await fetchProducts();
    }
  } catch (error) {
    showNotification('Failed to refresh data', 'error');
  }
};
```

---

## 🎨 **Frontend Implementation Examples**

### **React Hook Example:**
```javascript
import { useState, useEffect } from 'react';

const useHimalayaAPI = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const API_BASE = 'https://your-api.railway.app/api';

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch(`${API_BASE}/products`),
        fetch(`${API_BASE}/categories`)
      ]);

      const productsData = await productsRes.json();
      const categoriesData = await categoriesRes.json();

      if (productsData.success) {
        setProducts(productsData.data);
        setLastUpdate(productsData.metadata.lastUpdate);
      }

      if (categoriesData.success) {
        setCategories(categoriesData.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async (query, category = null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (category) params.append('category', category);

      const response = await fetch(`${API_BASE}/products/search?${params}`);
      const result = await response.json();
      
      return result.success ? result.data : [];
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    categories,
    loading,
    error,
    lastUpdate,
    searchProducts,
    refetch: fetchInitialData
  };
};

export default useHimalayaAPI;
```

---

### **Vue.js Component Example:**
```vue
<template>
  <div>
    <div class="filters">
      <input v-model="searchQuery" placeholder="Search products..." />
      <select v-model="selectedCategory">
        <option value="">All Categories</option>
        <option v-for="cat in categories" :key="cat" :value="cat">
          {{ cat }}
        </option>
      </select>
      <button @click="search" :disabled="loading">Search</button>
    </div>

    <div v-if="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else>
      <div class="product-count">
        Found {{ filteredProducts.length }} products
        <small>(Last updated: {{ formatDate(lastUpdate) }})</small>
      </div>
      
      <div class="products-grid">
        <div v-for="product in filteredProducts" :key="product.code" class="product-card">
          <h3>{{ product.description }}</h3>
          <p><strong>Code:</strong> {{ product.code }}</p>
          <p><strong>Category:</strong> {{ product.category }}</p>
          <p><strong>Price:</strong> Rp {{ product.price.toLocaleString() }}</p>
          <p :class="['status', product.status.available ? 'available' : 'unavailable']">
            {{ product.status.text }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProductList',
  data() {
    return {
      products: [],
      categories: [],
      filteredProducts: [],
      searchQuery: '',
      selectedCategory: '',
      loading: false,
      error: null,
      lastUpdate: null
    };
  },
  async created() {
    await this.fetchData();
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          fetch('https://your-api.railway.app/api/products'),
          fetch('https://your-api.railway.app/api/categories')
        ]);

        const productsData = await productsRes.json();
        const categoriesData = await categoriesRes.json();

        if (productsData.success) {
          this.products = productsData.data;
          this.filteredProducts = productsData.data;
          this.lastUpdate = productsData.metadata.lastUpdate;
        }

        if (categoriesData.success) {
          this.categories = categoriesData.data;
        }
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    async search() {
      this.loading = true;
      try {
        const params = new URLSearchParams();
        if (this.searchQuery) params.append('q', this.searchQuery);
        if (this.selectedCategory) params.append('category', this.selectedCategory);

        const response = await fetch(`https://your-api.railway.app/api/products/search?${params}`);
        const result = await response.json();
        
        this.filteredProducts = result.success ? result.data : [];
      } catch (err) {
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleString();
    }
  }
};
</script>
```

---

## 🔧 **CORS Configuration**

API sudah dikonfigurasi dengan CORS enabled untuk semua origins:

```javascript
app.use(cors()); // Allows all origins
```

Untuk production, bisa dibatasi ke specific domains:

```javascript
app.use(cors({
  origin: ['https://your-frontend.com', 'https://admin.your-frontend.com'],
  credentials: true
}));
```

---

## 📱 **Mobile App Integration**

### **React Native Example:**
```javascript
import axios from 'axios';

const HimalayaAPI = {
  baseURL: 'https://your-api.railway.app/api',

  async getProducts() {
    try {
      const response = await axios.get(`${this.baseURL}/products`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  },

  async searchProducts(query, category = null) {
    try {
      const params = {};
      if (query) params.q = query;
      if (category) params.category = category;

      const response = await axios.get(`${this.baseURL}/products/search`, { params });
      return response.data;
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  },

  async getCategories() {
    try {
      const response = await axios.get(`${this.baseURL}/categories`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
  }
};

export default HimalayaAPI;
```

---

## 🚨 **Error Handling**

### **Common Response Errors:**
```json
{
  "error": "No data available",
  "message": "Please try again in a moment while we fetch the latest data"
}
```

### **Frontend Error Handling Pattern:**
```javascript
const apiCall = async (endpoint) => {
  try {
    const response = await fetch(`https://your-api.railway.app${endpoint}`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || 'API Error');
    }
    
    return result.data;
  } catch (error) {
    console.error(`API Error for ${endpoint}:`, error);
    throw error;
  }
};
```

---

## ⚡ **Performance Tips**

### **1. Caching Strategy:**
```javascript
// Cache products for 1 minute
const CACHE_DURATION = 60000;
let cachedProducts = null;
let lastFetch = 0;

const getCachedProducts = async () => {
  const now = Date.now();
  
  if (cachedProducts && (now - lastFetch) < CACHE_DURATION) {
    return cachedProducts;
  }
  
  cachedProducts = await apiCall('/products');
  lastFetch = now;
  return cachedProducts;
};
```

### **2. Debounce Search:**
```javascript
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const debouncedSearch = debounce(async (query) => {
  const results = await searchProducts(query);
  setResults(results);
}, 300);
```

---

## 🔐 **Authentication (Future Enhancement)**

Jika butuh authentication, tambahkan middleware:

```javascript
// Backend
app.use('/api', authMiddleware);

// Frontend
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};

const response = await fetch(url, { headers });
```

---

## 📊 **Real-time Updates**

### **Polling Strategy:**
```javascript
useEffect(() => {
  const interval = setInterval(async () => {
    const status = await getApiStatus();
    if (new Date(status.cache.lastUpdate) > lastUpdate) {
      await fetchProducts(); // Refresh if data updated
    }
  }, 60000); // Check every minute

  return () => clearInterval(interval);
}, [lastUpdate]);
```

---

## 🎉 **Ready for Frontend Integration!**

**API ini sudah fully prepared untuk frontend integration dengan:**

- ✅ CORS enabled
- ✅ Structured JSON responses
- ✅ Comprehensive endpoints
- ✅ Error handling
- ✅ Metadata included
- ✅ Search & filtering capabilities
- ✅ Real-time data updates
- ✅ Mobile-friendly
- ✅ Production ready

**Frontend developers dapat langsung menggunakan endpoint-endpoint di atas untuk build aplikasi!** 🚀
