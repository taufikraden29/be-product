# 📊 Frontend Data Access Guide - Himalaya Scraper API

## 🎯 **Data Access Methods untuk Frontend**

### **✅ Cara 1: Static JSON File (Recommended untuk Development)**
```javascript
// Direct access ke static JSON file
const API_BASE = 'https://your-project.vercel.app';
const response = await fetch(`${API_BASE}/data.json`);
const data = await response.json();

console.log('Products:', data.products);
console.log('Categories:', data.categories);
console.log('Metadata:', data.metadata);
```

### **✅ Cara 2: Dynamic API (Recommended untuk Production)**
```javascript
// Dynamic API dengan pagination dan search
const API_BASE = 'https://your-project.vercel.app/api';

// Get semua produk dengan pagination
const response = await fetch(`${API_BASE}/products?page=1&limit=50`);
const result = await response.json();

console.log('Products:', result.data);
console.log('Pagination:', result.pagination);
```

---

## 📋 **Struktur Data JSON**

### **Metadata:**
```json
{
  "success": true,
  "message": "Himalaya Reload Products Data",
  "metadata": {
    "lastUpdate": "2025-11-21T03:33:00.343Z",
    "lastFetch": "2025-11-21T03:33:00.343Z", 
    "totalProducts": 2418,
    "categories": ["TELKOMSEL", "INDOSAT OOREDOO", "XL", "AXIS", ...]
  }
}
```

### **Product Structure:**
```json
{
  "category": "TELKOMSEL",
  "code": "S5",
  "description": "Telkomsel 5.000",
  "price": 5800,
  "status": {
    "text": "open",
    "available": true,
    "status": "open"
  }
}
```

---

## 🚀 **Frontend Implementation Examples**

### **React Hook Example:**
```javascript
import { useState, useEffect } from 'react';

const useHimalayaData = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Static data method
  const fetchStaticData = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://your-project.vercel.app/data.json');
      const data = await response.json();
      
      setProducts(data.products);
      setCategories(data.categories);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic API method
  const fetchProducts = async (page = 1, limit = 50) => {
    try {
      setLoading(true);
      const response = await fetch(`https://your-project.vercel.app/api/products?page=${page}&limit=${limit}`);
      const result = await response.json();
      
      if (result.success) {
        setProducts(result.data);
        return result.pagination;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Search products
  const searchProducts = async (query, category = null) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ q: query, limit: 50 });
      if (category) params.append('category', category);
      
      const response = await fetch(`https://your-project.vercel.app/api/products/search?${params}`);
      const result = await response.json();
      
      if (result.success) {
        return result.data;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaticData(); // Load static data on mount
  }, []);

  return {
    products,
    categories,
    loading,
    error,
    fetchProducts,
    searchProducts,
    fetchStaticData
  };
};

export default useHimalayaData;
```

### **Vanilla JavaScript Example:**
```javascript
class HimalayaAPI {
  constructor(baseURL = 'https://your-project.vercel.app') {
    this.baseURL = baseURL;
  }

  // Get static data
  async getStaticData() {
    const response = await fetch(`${this.baseURL}/data.json`);
    return await response.json();
  }

  // Get products with pagination
  async getProducts(page = 1, limit = 50) {
    const response = await fetch(`${this.baseURL}/api/products?page=${page}&limit=${limit}`);
    return await response.json();
  }

  // Search products
  async searchProducts(query, category = null, page = 1) {
    const params = new URLSearchParams({ q: query, page });
    if (category) params.append('category', category);
    
    const response = await fetch(`${this.baseURL}/api/products/search?${params}`);
    return await response.json();
  }

  // Get products by category
  async getProductsByCategory(category) {
    const response = await fetch(`${this.baseURL}/api/products/category/${encodeURIComponent(category)}`);
    return await response.json();
  }

  // Get available products only
  async getAvailableProducts() {
    const response = await fetch(`${this.baseURL}/api/products/available`);
    return await response.json();
  }

  // Get categories
  async getCategories() {
    const response = await fetch(`${this.baseURL}/api/categories`);
    return await response.json();
  }
}

// Usage example
const api = new HimalayaAPI();

// Load initial data
async function loadData() {
  try {
    const data = await api.getStaticData();
    console.log('Loaded', data.products.length, 'products');
    
    // Display categories
    data.categories.forEach(category => {
      console.log('Category:', category);
    });
    
    // Display products
    data.products.forEach(product => {
      console.log(`${product.code}: ${product.description} - Rp ${product.price.toLocaleString()}`);
    });
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

loadData();
```

### **Vue.js Example:**
```javascript
import { ref, onMounted } from 'vue';

export function useHimalayaProducts() {
  const products = ref([]);
  const categories = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const fetchProducts = async () => {
    try {
      loading.value = true;
      const response = await fetch('https://your-project.vercel.app/data.json');
      const data = await response.json();
      
      products.value = data.products;
      categories.value = data.categories;
    } catch (err) {
      error.value = err.message;
    } finally {
      loading.value = false;
    }
  };

  const filteredProducts = (category) => {
    return products.value.filter(p => p.category === category);
  };

  const searchProducts = (query) => {
    const searchQuery = query.toLowerCase();
    return products.value.filter(p => 
      p.code.toLowerCase().includes(searchQuery) ||
      p.description.toLowerCase().includes(searchQuery)
    );
  };

  onMounted(() => {
    fetchProducts();
  });

  return {
    products,
    categories,
    loading,
    error,
    filteredProducts,
    searchProducts
  };
}
```

---

## 📱 **Mobile App Integration**

### **React Native Example:**
```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('https://your-project.vercel.app/data.json');
        const data = await response.json();
        setProducts(data.products);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const renderProduct = ({ item }) => (
    <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold' }}>{item.description}</Text>
      <Text style={{ fontSize: 14, color: '#666' }}>{item.code}</Text>
      <Text style={{ fontSize: 14, color: '#green' }}>
        Rp {item.price.toLocaleString('id-ID')}
      </Text>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <FlatList
      data={products}
      renderItem={renderProduct}
      keyExtractor={item => item.code}
    />
  );
};
```

---

## 🎨 **UI Components Examples**

### **Product Table Component:**
```html
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Himalaya Products</title>
    <style>
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f4f4f4; font-weight: bold; }
        .available { color: green; }
        .unavailable { color: red; }
        .price { text-align: right; font-family: monospace; }
    </style>
</head>
<body>
    <h1>Himalaya Reload Products</h1>
    <table id="productsTable">
        <thead>
            <tr>
                <th>Kode</th>
                <th>Deskripsi</th>
                <th>Kategori</th>
                <th class="price">Harga</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody id="productsBody">
            <!-- Products will be loaded here -->
        </tbody>
    </table>

    <script>
        async function loadProducts() {
            try {
                const response = await fetch('https://your-project.vercel.app/data.json');
                const data = await response.json();
                
                const tbody = document.getElementById('productsBody');
                tbody.innerHTML = '';
                
                data.products.forEach(product => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${product.code}</td>
                        <td>${product.description}</td>
                        <td>${product.category}</td>
                        <td class="price">Rp ${product.price.toLocaleString('id-ID')}</td>
                        <td class="${product.status.available ? 'available' : 'unavailable'}">
                            ${product.status.text}
                        </td>
                    `;
                    tbody.appendChild(row);
                });
                
                console.log(`Loaded ${data.products.length} products`);
            } catch (error) {
                console.error('Error loading products:', error);
                document.getElementById('productsBody').innerHTML = 
                    '<tr><td colspan="5">Error loading products</td></tr>';
            }
        }

        // Load products when page loads
        loadProducts();
    </script>
</body>
</html>
```

---

## 📊 **Data Analytics Examples**

### **Category Statistics:**
```javascript
// Analyze products by category
function analyzeCategories(products) {
  const stats = {};
  
  products.forEach(product => {
    if (!stats[product.category]) {
      stats[product.category] = {
        count: 0,
        totalValue: 0,
        available: 0,
        averagePrice: 0
      };
    }
    
    stats[product.category].count++;
    stats[product.category].totalValue += product.price;
    
    if (product.status.available) {
      stats[product.category].available++;
    }
  });
  
  // Calculate averages
  Object.keys(stats).forEach(category => {
    const cat = stats[category];
    cat.averagePrice = Math.round(cat.totalValue / cat.count);
    cat.availabilityRate = Math.round((cat.available / cat.count) * 100);
  });
  
  return stats;
}

// Usage
const stats = analyzeCategories(data.products);
console.log('Category Statistics:', stats);
```

### **Price Range Analysis:**
```javascript
function analyzePriceRanges(products) {
  const prices = products.map(p => p.price).sort((a, b) => a - b);
  
  return {
    cheapest: prices[0],
    mostExpensive: prices[prices.length - 1],
    average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    median: prices[Math.floor(prices.length / 2)],
    totalProducts: prices.length
  };
}
```

---

## 🔍 **Search & Filter Examples**

### **Advanced Search Function:**
```javascript
class ProductSearcher {
  constructor(products) {
    this.products = products;
  }

  // Search by multiple criteria
  search(filters) {
    return this.products.filter(product => {
      // Category filter
      if (filters.category && product.category !== filters.category) {
        return false;
      }
      
      // Price range filter
      if (filters.minPrice && product.price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice && product.price > filters.maxPrice) {
        return false;
      }
      
      // Availability filter
      if (filters.available !== undefined && product.status.available !== filters.available) {
        return false;
      }
      
      // Text search
      if (filters.query) {
        const query = filters.query.toLowerCase();
        const searchableText = `${product.code} ${product.description} ${product.category}`.toLowerCase();
        if (!searchableText.includes(query)) {
          return false;
        }
      }
      
      return true;
    });
  }

  // Sort results
  sort(results, sortBy = 'code', order = 'asc') {
    return results.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (order === 'desc') {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      } else {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      }
    });
  }
}

// Usage
const searcher = new ProductSearcher(data.products);
let results = searcher.search({ 
  query: 'telkomsel', 
  minPrice: 5000, 
  maxPrice: 20000,
  available: true 
});
results = searcher.sort(results, 'price', 'asc');
```

---

## 🚀 **Performance Tips**

### **Caching Strategy:**
```javascript
class CachedProductAPI {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async getProducts(forceRefresh = false) {
    const cacheKey = 'products';
    const cached = this.cache.get(cacheKey);
    
    if (!forceRefresh && cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    const response = await fetch('https://your-project.vercel.app/data.json');
    const data = await response.json();
    
    this.cache.set(cacheKey, {
      data: data,
      timestamp: Date.now()
    });
    
    return data;
  }
}
```

---

## 🌐 **CORS & Security**

### **Frontend Headers:**
```javascript
// Include proper headers for API requests
const apiHeaders = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Cache-Control': 'no-cache'
};

const response = await fetch('https://your-project.vercel.app/api/products', {
  headers: apiHeaders
});
```

---

## 📱 **Progressive Web App Integration**

### **Service Worker for Offline:**
```javascript
// sw.js
const CACHE_NAME = 'himalaya-products-v1';
const DATA_URL = 'https://your-project.vercel.app/data.json';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.add(DATA_URL))
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('data.json')) {
    event.respondWith(
      caches.match(DATA_URL)
        .then(response => response || fetch(DATA_URL))
    );
  }
});
```

---

## 🎯 **Quick Start Summary**

### **Langkah 1: Pilih Method**
- **Development:** Gunakan `/data.json` (static, cepat)
- **Production:** Gunakan `/api/products` (dynamic, real-time)

### **Langkah 2: Implementasi**
```javascript
// Simple implementation
fetch('https://your-project.vercel.app/data.json')
  .then(response => response.json())
  .then(data => {
    console.log('Products loaded:', data.products.length);
    // Display products in UI
  });
```

### **Langkah 3: Enhanced Features**
- Tambahkan pagination
- Implement search
- Filter by category
- Sort by price/code
- Cache untuk performance

---

## 📚 **API Endpoints Reference**

| Endpoint | Method | Description | Use Case |
|-----------|--------|-------------|-----------|
| `/data.json` | GET | Static JSON file | Quick development, simple apps |
| `/api/products` | GET | Dynamic with pagination | Production apps |
| `/api/products/search` | GET | Search & filter | Advanced filtering |
| `/api/products/category/:cat` | GET | By category | Category views |
| `/api/products/available` | GET | Available only | Stock management |
| `/api/categories` | GET | All categories | Category selection |

---

**Status: ✅ FRONTEND READY**  
**Last Updated: 2025-11-21**  
**Data Format: JSON with full product catalog**
