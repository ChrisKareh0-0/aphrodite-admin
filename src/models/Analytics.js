const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['page_view', 'product_view', 'add_to_cart', 'purchase', 'user_registration'],
    required: true
  },
  data: {
    // For page views
    page: String,
    referrer: String,
    userAgent: String,
    
    // For product views
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    
    // For purchases
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    amount: Number,
    
    // For user registrations
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    
    // Common fields
    sessionId: String,
    ipAddress: String,
    country: String,
    city: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
analyticsSchema.index({ date: -1, type: 1 });
analyticsSchema.index({ type: 1, 'data.productId': 1 });
analyticsSchema.index({ type: 1, 'data.categoryId': 1 });

module.exports = mongoose.model('Analytics', analyticsSchema);

