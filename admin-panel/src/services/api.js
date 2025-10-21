import axios from 'axios';

// Default to window origin at runtime so the admin panel works when served from the
// backend in production. Fallback to localhost for local development.
// Switch API base URL based on environment
let API_URL = '/api';
if (typeof window !== 'undefined') {
  if (window.location.hostname === 'localhost') {
    API_URL = 'http://localhost:3001/api';
  }
}
if (process.env.REACT_APP_API_URL) {
  API_URL = process.env.REACT_APP_API_URL;
}

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log both response-based errors and network errors
    const errData = error?.response?.data || { message: error?.message };
    console.error('API Error:', errData);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export const api = {
  setToken: (token) => {
    if (token) {
      apiClient.defaults.headers.Authorization = `Bearer ${token}`;
    } else {
      delete apiClient.defaults.headers.Authorization;
    }
  },

  // Auth endpoints
  auth: {
    login: (credentials) => apiClient.post('/auth/login', credentials),
    me: () => apiClient.get('/auth/me'),
    updateProfile: (data) => apiClient.put('/auth/profile', data),
    changePassword: (data) => apiClient.put('/auth/password', data),
  },

  // Orders endpoints
  orders: {
    getAll: (params) => {
      console.log('API: Fetching orders with params:', params);
      return apiClient.get('/orders', { params }).then(response => {
        console.log('API: Orders response:', response.data);
        return response;
      }).catch(error => {
        console.error('API: Orders fetch error:', error.response?.status, error.response?.data);
        throw error;
      });
    },
    getById: (id) => apiClient.get(`/orders/${id}`),
    updateStatus: (id, status) => apiClient.patch(`/orders/${id}/status`, { status }),
    delete: (id) => apiClient.delete(`/orders/${id}`),
  },

  // Customers endpoints
  customers: {
    getAll: () => apiClient.get('/orders/customers/all'),
  },

  // Hero image management
  settings: {
    getHero: () => apiClient.get('/settings/hero'),
    updateHero: (formData) => {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      };
      return apiClient.post('/settings/hero', formData, config);
    },
  },

  // Categories endpoints
  categories: {
    getAll: () => apiClient.get('/categories'),
    getById: (id) => apiClient.get(`/categories/${id}`),
    create: (data) => {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      return apiClient.post('/categories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    update: (id, data) => {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      return apiClient.put(`/categories/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    delete: (id) => apiClient.delete(`/categories/${id}`),
    toggleStatus: (id) => apiClient.put(`/categories/${id}/toggle-status`),
  },

  // Products endpoints
  products: {
    getAll: (params) => apiClient.get('/products', { params }),
    getById: (id) => apiClient.get(`/products/${id}`),
    create: (data) => {
      const formData = new FormData();

      // Handle regular fields
      Object.keys(data).forEach(key => {
        if (key !== 'images' && data[key] !== null && data[key] !== undefined) {
          if (typeof data[key] === 'object') {
            formData.append(key, JSON.stringify(data[key]));
          } else {
            formData.append(key, data[key]);
          }
        }
      });

      // Handle images
      if (data.images && data.images.length > 0) {
        data.images.forEach(image => {
          formData.append('images', image);
        });
      }

      return apiClient.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    update: (id, data) => {
      const formData = new FormData();

      // Handle regular fields
      Object.keys(data).forEach(key => {
        if (key !== 'images' && data[key] !== null && data[key] !== undefined) {
          if (typeof data[key] === 'object') {
            formData.append(key, JSON.stringify(data[key]));
          } else {
            formData.append(key, data[key]);
          }
        }
      });

      // Handle new images
      if (data.images && data.images.length > 0) {
        data.images.forEach(image => {
          formData.append('images', image);
        });
      }

      return apiClient.put(`/products/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    delete: (id) => apiClient.delete(`/products/${id}`),
    toggleStatus: (id) => apiClient.put(`/products/${id}/toggle-status`),
    removeImage: (id, imageIndex) => apiClient.delete(`/products/${id}/images/${imageIndex}`),
  },

  // Public endpoints (for testing)
  public: {
    getCategories: () => apiClient.get('/public/categories'),
    getProducts: (params) => apiClient.get('/public/products', { params }),
    getProduct: (slug) => apiClient.get(`/public/products/${slug}`),
    getFeatured: (params) => apiClient.get('/public/featured', { params }),
    getStats: () => apiClient.get('/public/stats'),
  },
};

export default apiClient;