import axios from 'axios';
import mongoose from 'mongoose';

// API Documentation and Testing Controller
const getApiDocumentation = async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    const apiDocs = {
      title: 'Aphrodite Store API Documentation',
      version: '1.0.0',
      baseUrl: baseUrl,
      description: 'Complete API documentation for Aphrodite fashion store backend',
      endpoints: {
        // Authentication
        auth: {
          login: {
            method: 'POST',
            url: '/api/auth/login',
            description: 'Admin login',
            body: {
              email: 'admin@aphrodite.com',
              password: 'admin123'
            },
            response: {
              success: true,
              token: 'jwt_token_here',
              user: {
                id: 'user_id',
                name: 'Admin User',
                email: 'admin@aphrodite.com',
                role: 'admin'
              }
            }
          },
          register: {
            method: 'POST',
            url: '/api/auth/register',
            description: 'Register new admin user',
            body: {
              name: 'New Admin',
              email: 'newadmin@example.com',
              password: 'password123'
            }
          }
        },
        
        // Products
        products: {
          getAll: {
            method: 'GET',
            url: '/api/products',
            description: 'Get all products with pagination and filters',
            query: {
              page: 1,
              limit: 10,
              category: 'category_id',
              search: 'search_term',
              isActive: true,
              isFeatured: true,
              sortBy: 'name|price|createdAt',
              sortOrder: 'asc|desc'
            }
          },
          getById: {
            method: 'GET',
            url: '/api/products/:id',
            description: 'Get product by ID'
          },
          create: {
            method: 'POST',
            url: '/api/products',
            description: 'Create new product',
            headers: {
              'Authorization': 'Bearer jwt_token',
              'Content-Type': 'application/json'
            },
            body: {
              name: 'Product Name',
              description: 'Product description',
              price: 99.99,
              category: 'category_id',
              stock: 100,
              images: [
                {
                  url: 'image_url',
                  alt: 'Image description',
                  isPrimary: true
                }
              ],
              colors: [
                {
                  name: 'Red',
                  code: '#FF0000',
                  available: true
                }
              ],
              sizes: [
                {
                  name: 'M',
                  available: true
                }
              ],
              tags: ['tag1', 'tag2'],
              isFeatured: false,
              isOnSale: false
            }
          },
          update: {
            method: 'PUT',
            url: '/api/products/:id',
            description: 'Update product',
            headers: {
              'Authorization': 'Bearer jwt_token'
            }
          },
          delete: {
            method: 'DELETE',
            url: '/api/products/:id',
            description: 'Delete product',
            headers: {
              'Authorization': 'Bearer jwt_token'
            }
          }
        },
        
        // Categories
        categories: {
          getAll: {
            method: 'GET',
            url: '/api/categories',
            description: 'Get all categories'
          },
          getById: {
            method: 'GET',
            url: '/api/categories/:id',
            description: 'Get category by ID'
          },
          create: {
            method: 'POST',
            url: '/api/categories',
            description: 'Create new category',
            headers: {
              'Authorization': 'Bearer jwt_token'
            },
            body: {
              name: 'Category Name',
              description: 'Category description',
              image: 'image_url'
            }
          },
          update: {
            method: 'PUT',
            url: '/api/categories/:id',
            description: 'Update category',
            headers: {
              'Authorization': 'Bearer jwt_token'
            }
          },
          delete: {
            method: 'DELETE',
            url: '/api/categories/:id',
            description: 'Delete category',
            headers: {
              'Authorization': 'Bearer jwt_token'
            }
          }
        },
        
        // Public API
        public: {
          products: {
            method: 'GET',
            url: '/api/public/products',
            description: 'Get public products (no auth required)',
            query: {
              page: 1,
              limit: 12,
              category: 'category_slug',
              search: 'search_term',
              sortBy: 'name|price|rating',
              sortOrder: 'asc|desc'
            }
          },
          categories: {
            method: 'GET',
            url: '/api/public/categories',
            description: 'Get public categories (no auth required)'
          },
          productBySlug: {
            method: 'GET',
            url: '/api/public/products/slug/:slug',
            description: 'Get product by slug (no auth required)'
          }
        },
        
        // Dashboard Analytics
        dashboard: {
          stats: {
            method: 'GET',
            url: '/api/dashboard/stats',
            description: 'Get dashboard overview statistics',
            headers: {
              'Authorization': 'Bearer jwt_token'
            }
          },
          salesAnalytics: {
            method: 'GET',
            url: '/api/dashboard/sales-analytics',
            description: 'Get sales analytics with date range',
            headers: {
              'Authorization': 'Bearer jwt_token'
            },
            query: {
              period: '7d|30d|90d|1y',
              startDate: 'YYYY-MM-DD',
              endDate: 'YYYY-MM-DD'
            }
          },
          productAnalytics: {
            method: 'GET',
            url: '/api/dashboard/product-analytics',
            description: 'Get product analytics',
            headers: {
              'Authorization': 'Bearer jwt_token'
            }
          },
          customerAnalytics: {
            method: 'GET',
            url: '/api/dashboard/customer-analytics',
            description: 'Get customer analytics',
            headers: {
              'Authorization': 'Bearer jwt_token'
            }
          }
        },
        
        // Orders
        orders: {
          getAll: {
            method: 'GET',
            url: '/api/orders',
            description: 'Get all orders',
            headers: {
              'Authorization': 'Bearer jwt_token'
            },
            query: {
              page: 1,
              limit: 10,
              status: 'pending|processing|shipped|delivered|cancelled',
              startDate: 'YYYY-MM-DD',
              endDate: 'YYYY-MM-DD'
            }
          },
          getById: {
            method: 'GET',
            url: '/api/orders/:id',
            description: 'Get order by ID',
            headers: {
              'Authorization': 'Bearer jwt_token'
            }
          },
          create: {
            method: 'POST',
            url: '/api/orders',
            description: 'Create new order',
            body: {
              customer: {
                name: 'Customer Name',
                email: 'customer@example.com',
                phone: '+1234567890',
                address: {
                  street: '123 Main St',
                  city: 'City',
                  state: 'State',
                  zipCode: '12345',
                  country: 'US'
                }
              },
              items: [
                {
                  product: 'product_id',
                  quantity: 2,
                  price: 99.99,
                  size: 'M',
                  color: 'Red'
                }
              ],
              paymentMethod: 'credit_card'
            }
          },
          updateStatus: {
            method: 'PATCH',
            url: '/api/orders/:id/status',
            description: 'Update order status',
            headers: {
              'Authorization': 'Bearer jwt_token'
            },
            body: {
              status: 'processing|shipped|delivered|cancelled'
            }
          }
        }
      },
      
      // Common Response Formats
      responseFormats: {
        success: {
          success: true,
          data: 'response_data_here',
          message: 'Success message'
        },
        error: {
          success: false,
          message: 'Error message',
          error: 'Detailed error information'
        },
        pagination: {
          success: true,
          data: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 100,
            pages: 10,
            hasNext: true,
            hasPrev: false
          }
        }
      },
      
      // Authentication
      authentication: {
        type: 'Bearer Token',
        description: 'Include JWT token in Authorization header',
        example: 'Authorization: Bearer your_jwt_token_here'
      },
      
      // Error Codes
      errorCodes: {
        400: 'Bad Request - Invalid input data',
        401: 'Unauthorized - Invalid or missing token',
        403: 'Forbidden - Insufficient permissions',
        404: 'Not Found - Resource not found',
        409: 'Conflict - Resource already exists',
        422: 'Unprocessable Entity - Validation error',
        500: 'Internal Server Error - Server error'
      }
    };

    res.json({
      success: true,
      data: apiDocs
    });
  } catch (error) {
    console.error('API documentation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate API documentation',
      error: error.message
    });
  }
};

// Test API endpoint
const testApiEndpoint = async (req, res) => {
  try {
    const { method, url, headers = {}, body = {} } = req.body;
    
    if (!method || !url) {
      return res.status(400).json({
        success: false,
        message: 'Method and URL are required'
      });
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
    
    const config = {
      method: method.toLowerCase(),
      url: fullUrl,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      timeout: 10000
    };

    if (method.toLowerCase() !== 'get' && Object.keys(body).length > 0) {
      config.data = body;
    }

    const response = await axios(config);
    
    res.json({
      success: true,
      data: {
        request: {
          method: config.method.toUpperCase(),
          url: fullUrl,
          headers: config.headers,
          body: config.data || null
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    const errorResponse = {
      success: false,
      data: {
        request: {
          method: req.body.method?.toUpperCase(),
          url: req.body.url,
          headers: req.body.headers || {},
          body: req.body.body || null
        },
        error: {
          message: error.message,
          code: error.code,
          status: error.response?.status || 500,
          statusText: error.response?.statusText || 'Internal Server Error',
          data: error.response?.data || null
        },
        timestamp: new Date().toISOString()
      }
    };

    res.status(500).json(errorResponse);
  }
};

// Get API health status
const getApiHealth = async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        server: 'running'
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    };

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
};

export {
  getApiDocumentation,
  testApiEndpoint,
  getApiHealth
};

