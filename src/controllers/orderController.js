const Order = require('../models/Order');
const Product = require('../models/Product');

// Get all orders with pagination and filters
const getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      startDate,
      endDate,
      customerEmail,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }
    
    if (customerEmail) {
      filter['customer.email'] = { $regex: customerEmail, $options: 'i' };
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const orders = await Order.find(filter)
      .populate('items.product', 'name price images')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name price images description');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

// Create new order
const createOrder = async (req, res) => {
  try {
    const { customer, items, paymentMethod = 'credit_card', notes } = req.body;

    // Validate required fields
    if (!customer || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Customer information and items are required'
      });
    }

    // Validate and calculate totals - use batch query to avoid N+1
    let subtotal = 0;
    const validatedItems = [];

    // Fetch all products at once instead of one by one (avoids N+1 query problem)
    const productIds = items.map(item => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    for (const item of items) {
      const product = productMap.get(item.product.toString());
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product with ID ${item.product} not found`
        });
      }

      // Check stock for specific color and size
      const stockItem = product.stock.find(s => s.color === item.color && s.size === item.size);
      if (!stockItem || stockItem.quantity < item.quantity) {
        const available = stockItem ? stockItem.quantity : 0;
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product ${product.name} in ${item.color} color, size ${item.size}. Available: ${available}`
        });
      }

      const itemTotal = product.price * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price,
        size: item.size,
        color: item.color
      });
    }

    // Calculate totals
    const tax = subtotal * 0.08; // 8% tax
    const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
    const total = subtotal + tax + shipping;

    // Create order
    const order = new Order({
      customer,
      items: validatedItems,
      subtotal,
      tax,
      shipping,
      total,
      paymentMethod,
      notes,
      status: 'pending',
      paymentStatus: 'pending'
    });

    await order.save();

    // Update product stock for specific color and size
    for (const item of validatedItems) {
      const updateResult = await Product.findOneAndUpdate(
        {
          _id: item.product,
          'stock.color': item.color,
          'stock.size': item.size
        },
        {
          $inc: { 'stock.$.quantity': -item.quantity }
        },
        { new: true }
      );

      // If update failed, log error and throw
      if (!updateResult) {
        console.error(`Failed to update stock for product ${item.product}, color: ${item.color}, size: ${item.size}`);
        throw new Error(`Failed to update stock for product ${item.product}`);
      }
    }

    const populatedOrder = await Order.findById(order._id)
      .populate('items.product', 'name price images');

    res.status(201).json({
      success: true,
      data: populatedOrder,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Valid statuses: ' + validStatuses.join(', ')
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Update status and timestamps
    const updateData = { status };
    
    if (status === 'shipped' && !order.shippedAt) {
      updateData.shippedAt = new Date();
    }
    
    if (status === 'delivered' && !order.deliveredAt) {
      updateData.deliveredAt = new Date();
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('items.product', 'name price images');

    res.json({
      success: true,
      data: updatedOrder,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

// Delete order
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Restore product stock if order is cancelled
    if (order.status === 'cancelled' || order.status === 'refunded') {
      for (const item of order.items) {
        await Product.findOneAndUpdate(
          {
            _id: item.product,
            'stock.color': item.color,
            'stock.size': item.size
          },
          {
            $inc: { 'stock.$.quantity': item.quantity }
          }
        );
      }
    }

    await Order.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete order',
      error: error.message
    });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder
};

