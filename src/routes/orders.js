import express from 'express';
import { auth } from '../middleware/auth.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

const router = express.Router();

// Get all orders (Admin) with pagination
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    console.log(`Fetching orders - Page: ${page}, Limit: ${limit}`);

    // Fetch orders with pagination and optimizations
    const orders = await Order.find()
      .populate('items.product', 'name price images')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean();

    // Get total count for pagination
    const total = await Order.countDocuments();
    const totalPages = Math.ceil(total / limit);

    console.log(`Found ${orders.length} orders (${total} total)`);
    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Error fetching orders' });
  }
});

// Get all customers (Admin) - MUST be before /:id route
router.get('/customers/all', auth, async (req, res) => {
  try {
    console.log('Fetching all customers...');

    // Aggregate orders to get unique customers with their stats
    const customers = await Order.aggregate([
      {
        $group: {
          _id: '$customer.email',
          name: { $first: '$customer.name' },
          email: { $first: '$customer.email' },
          phone: { $first: '$customer.phone' },
          address: { $first: '$customer.address' },
          totalOrders: { $sum: 1 },
          totalSpent: {
            $sum: {
              $cond: [
                { $in: ['$status', ['cancelled', 'refunded']] },
                0,
                '$total'
              ]
            }
          },
          lastOrderDate: { $max: '$createdAt' }
        }
      },
      {
        $sort: { lastOrderDate: -1 }
      }
    ]);

    console.log(`Found ${customers.length} customers`);
    res.json({ customers });
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: 'Error fetching customers' });
  }
});

// Create new order (Public - from storefront)
router.post('/create', async (req, res) => {
  try {
    console.log('Backend: Received order creation request');
    const { customer, items, subtotal, shipping, tax, total, paymentMethod, notes } = req.body;

    // Validate required fields
    if (!customer || !customer.name || !customer.email || !customer.phone) {
      console.log('Backend: Customer information validation failed');
      return res.status(400).json({ error: 'Customer information is required' });
    }

    if (!customer.address || !customer.address.street || !customer.address.city || !customer.address.state || !customer.address.zipCode) {
      console.log('Backend: Address validation failed');
      return res.status(400).json({ error: 'Complete shipping address is required' });
    }

    if (!items || items.length === 0) {
      console.log('Backend: Items validation failed');
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    console.log(`Backend: Validating ${items.length} products...`);
    // Verify products exist and prices match
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        console.log(`Backend: Product ${item.product} not found`);
        return res.status(400).json({ error: `Product ${item.product} not found` });
      }
      if (product.price !== item.price) {
        console.log(`Backend: Price mismatch for product ${product.name}`);
        return res.status(400).json({ error: `Price mismatch for product ${product.name}` });
      }
    }

    console.log('Backend: Creating order in database...');
    // Create order
    const order = new Order({
      customer,
      items,
      subtotal,
      shipping: shipping || 0,
      tax: tax || 0,
      total,
      paymentMethod: paymentMethod || 'cash_on_delivery',
      paymentStatus: paymentMethod === 'cash_on_delivery' ? 'pending' : 'pending',
      notes
    });

    await order.save();
    console.log(`Backend: Order saved successfully! Order Number: ${order.orderNumber}, ID: ${order._id}`);

    res.status(201).json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        _id: order._id,
        total: order.total,
        status: order.status
      }
    });
  } catch (err) {
    console.error('Backend: Error creating order:', err);
    res.status(400).json({ error: err.message || 'Error creating order' });
  }
});

// Get order by ID or order number
router.get('/:id', async (req, res) => {
  try {
    const searchParam = req.params.id;
    console.log('Searching for order with param:', searchParam);
    let query = {};

    // Check if it's a valid MongoDB ObjectId
    const mongoose = await import('mongoose');
    if (mongoose.Types.ObjectId.isValid(searchParam) && /^[0-9a-fA-F]{24}$/.test(searchParam)) {
      // Valid ObjectId format, search by both _id and orderNumber
      console.log('Searching by ObjectId and orderNumber');
      query = {
        $or: [
          { _id: searchParam },
          { orderNumber: searchParam }
        ]
      };
    } else {
      // Not a valid ObjectId, search only by orderNumber
      console.log('Searching only by orderNumber');
      query = { orderNumber: searchParam };
    }

    const order = await Order.findOne(query).populate('items.product', 'name price images');

    if (!order) {
      console.log('Order not found for query:', query);
      return res.status(404).json({ error: 'Order not found' });
    }

    console.log('Order found:', order.orderNumber);
    res.json({ order });
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: 'Error fetching order' });
  }
});

// Update order status (Admin)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order });
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(400).json({ error: 'Error updating order' });
  }
});

// Delete order (Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('Deleting order:', req.params.id);
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    console.log('Order deleted successfully:', order.orderNumber);
    res.json({ message: 'Order deleted successfully', order });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ error: 'Error deleting order' });
  }
});

export default router;