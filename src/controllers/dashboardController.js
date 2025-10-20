import Product from '../models/Product.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import Order from '../models/Order.js';

// Get dashboard overview statistics
const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));

    // Parallel queries for better performance
    const [
      totalProducts,
      activeProducts,
      totalCategories,
      totalUsers,
      totalOrders,
      monthlyOrders,
      weeklyOrders,
      dailyOrders,
      totalRevenue,
      monthlyRevenue,
      weeklyRevenue,
      dailyRevenue,
      lowStockProducts,
      recentOrders,
      topCategories,
      topProducts
    ] = await Promise.all([
      // Product stats
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Category.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: true }),
      
      // Order counts
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
      Order.countDocuments({ createdAt: { $gte: startOfWeek } }),
      Order.countDocuments({ createdAt: { $gte: startOfDay } }),
      
      // Revenue calculations
      Order.aggregate([
        { $match: { status: { $nin: ['cancelled', 'refunded'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfMonth }, status: { $nin: ['cancelled', 'refunded'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfWeek }, status: { $nin: ['cancelled', 'refunded'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: startOfDay }, status: { $nin: ['cancelled', 'refunded'] } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      
      // Low stock products
      Product.find({ stock: { $lte: 10 } }).select('name stock').limit(5),
      
      // Recent orders
      Order.find()
        .populate('items.product', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderNumber customer total status createdAt'),
      
      // Top categories by product count
      Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
        { $unwind: '$category' },
        { $project: { name: '$category.name', count: 1 } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      
      // Top products by order count
      Order.aggregate([
        { $unwind: '$items' },
        { $group: { _id: '$items.product', count: { $sum: '$items.quantity' } } },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
        { $project: { name: '$product.name', count: 1 } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    const stats = {
      overview: {
        totalProducts,
        activeProducts,
        totalCategories,
        totalUsers,
        totalOrders
      },
      orders: {
        total: totalOrders,
        monthly: monthlyOrders,
        weekly: weeklyOrders,
        daily: dailyOrders
      },
      revenue: {
        total: totalRevenue[0]?.total || 0,
        monthly: monthlyRevenue[0]?.total || 0,
        weekly: weeklyRevenue[0]?.total || 0,
        daily: dailyRevenue[0]?.total || 0
      },
      alerts: {
        lowStockProducts
      },
      recent: {
        orders: recentOrders
      },
      analytics: {
        topCategories,
        topProducts
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message
    });
  }
};

// Get sales analytics with date range
const getSalesAnalytics = async (req, res) => {
  try {
    const { period = '30d', startDate, endDate } = req.query;
    
    let dateFilter = {};
    const now = new Date();
    
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      switch (period) {
        case '7d':
          dateFilter = { createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } };
          break;
        case '30d':
          dateFilter = { createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } };
          break;
        case '90d':
          dateFilter = { createdAt: { $gte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) } };
          break;
        case '1y':
          dateFilter = { createdAt: { $gte: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000) } };
          break;
      }
    }

    const [
      dailySales,
      orderStatusStats,
      paymentMethodStats,
      topSellingProducts,
      salesByCategory
    ] = await Promise.all([
      // Daily sales data
      Order.aggregate([
        { $match: { ...dateFilter, status: { $nin: ['cancelled', 'refunded'] } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            totalSales: { $sum: '$total' },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      
      // Order status distribution
      Order.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      
      // Payment method distribution
      Order.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$paymentMethod', count: { $sum: 1 } } }
      ]),
      
      // Top selling products
      Order.aggregate([
        { $match: { ...dateFilter, status: { $nin: ['cancelled', 'refunded'] } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.product',
            totalQuantity: { $sum: '$items.quantity' },
            totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
          }
        },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
        { $project: { name: '$product.name', totalQuantity: 1, totalRevenue: 1 } },
        { $sort: { totalQuantity: -1 } },
        { $limit: 10 }
      ]),
      
      // Sales by category
      Order.aggregate([
        { $match: { ...dateFilter, status: { $nin: ['cancelled', 'refunded'] } } },
        { $unwind: '$items' },
        { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
        { $lookup: { from: 'categories', localField: 'product.category', foreignField: '_id', as: 'category' } },
        { $unwind: '$category' },
        {
          $group: {
            _id: '$category._id',
            categoryName: { $first: '$category.name' },
            totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
            totalQuantity: { $sum: '$items.quantity' }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        dailySales,
        orderStatusStats,
        paymentMethodStats,
        topSellingProducts,
        salesByCategory,
        period,
        dateFilter
      }
    });
  } catch (error) {
    console.error('Sales analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales analytics',
      error: error.message
    });
  }
};

// Get product analytics
const getProductAnalytics = async (req, res) => {
  try {
    const [
      productStats,
      categoryStats,
      stockAlerts,
      featuredProducts,
      onSaleProducts
    ] = await Promise.all([
      // Product statistics
      Product.aggregate([
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            activeProducts: { $sum: { $cond: ['$isActive', 1, 0] } },
            featuredProducts: { $sum: { $cond: ['$isFeatured', 1, 0] } },
            onSaleProducts: { $sum: { $cond: ['$isOnSale', 1, 0] } },
            avgPrice: { $avg: '$price' },
            totalStock: { $sum: '$stock' },
            lowStockCount: { $sum: { $cond: [{ $lte: ['$stock', 10] }, 1, 0] } }
          }
        }
      ]),
      
      // Category statistics
      Category.aggregate([
        { $match: { isActive: true } },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: 'category',
            as: 'products'
          }
        },
        {
          $project: {
            name: 1,
            productCount: { $size: '$products' },
            avgPrice: { $avg: '$products.price' },
            totalStock: { $sum: '$products.stock' }
          }
        },
        { $sort: { productCount: -1 } }
      ]),
      
      // Stock alerts
      Product.find({ stock: { $lte: 10 } })
        .populate('category', 'name')
        .select('name stock category price')
        .sort({ stock: 1 }),
      
      // Featured products
      Product.find({ isFeatured: true, isActive: true })
        .populate('category', 'name')
        .select('name price stock category rating')
        .sort({ sortOrder: 1 }),
      
      // On sale products
      Product.find({ isOnSale: true, isActive: true })
        .populate('category', 'name')
        .select('name price originalPrice stock category')
        .sort({ sortOrder: 1 })
    ]);

    res.json({
      success: true,
      data: {
        productStats: productStats[0] || {},
        categoryStats,
        stockAlerts,
        featuredProducts,
        onSaleProducts
      }
    });
  } catch (error) {
    console.error('Product analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product analytics',
      error: error.message
    });
  }
};

// Get customer analytics
const getCustomerAnalytics = async (req, res) => {
  try {
    const [
      customerStats,
      recentCustomers,
      topCustomers,
      customerGrowth
    ] = await Promise.all([
      // Customer statistics
      User.aggregate([
        {
          $group: {
            _id: null,
            totalCustomers: { $sum: 1 },
            activeCustomers: { $sum: { $cond: ['$isActive', 1, 0] } },
            adminUsers: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
            superAdmins: { $sum: { $cond: [{ $eq: ['$role', 'super-admin'] }, 1, 0] } }
          }
        }
      ]),
      
      // Recent customers
      User.find({ isActive: true })
        .select('name email role createdAt lastLogin')
        .sort({ createdAt: -1 })
        .limit(10),
      
      // Top customers by order value
      Order.aggregate([
        { $match: { status: { $nin: ['cancelled', 'refunded'] } } },
        {
          $group: {
            _id: '$customer.email',
            totalSpent: { $sum: '$total' },
            orderCount: { $sum: 1 }
          }
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 }
      ]),
      
      // Customer growth over time
      User.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        customerStats: customerStats[0] || {},
        recentCustomers,
        topCustomers,
        customerGrowth
      }
    });
  } catch (error) {
    console.error('Customer analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer analytics',
      error: error.message
    });
  }
};

export {
  getDashboardStats,
  getSalesAnalytics,
  getProductAnalytics,
  getCustomerAnalytics
};

