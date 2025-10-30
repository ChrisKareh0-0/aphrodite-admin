import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: true
  },
  shortDescription: {
    type: String,
    maxlength: 200
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  images: [{
    path: String, // optional: filesystem path, e.g. 'products/product-<id>-<index>.png'
    data: Buffer, // image binary data
    contentType: String, // image MIME type
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  colors: [{
    name: String,
    code: String, // hex color code
    available: {
      type: Boolean,
      default: true
    }
  }],
  sizes: [{
    name: String,
    available: {
      type: Boolean,
      default: true
    }
  }],
  stock: [{
    color: String,
    size: String,
    quantity: {
      type: Number,
      default: 0,
      min: 0
    }
  }],
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isOnSale: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  seo: {
    title: String,
    description: String,
    keywords: [String]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Generate slug from name before saving
productSchema.pre('save', function(next) {
  if (this.isModified('name') || this.isNew) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Index for search
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isActive: 1, isFeatured: 1 });

export default mongoose.model('Product', productSchema);