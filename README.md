# Aphrodite Backend & Admin Panel

A complete backend API and admin panel for the Aphrodite fashion website, built with Node.js, Express, MongoDB, and React.

## Features

### Backend API
- **Authentication**: JWT-based admin authentication
- **Products Management**: Full CRUD operations for products
- **Categories Management**: Full CRUD operations for categories
- **Image Upload**: Support for multiple product images
- **Public API**: Endpoints for frontend consumption
- **Database**: MongoDB with Mongoose ODM
- **Security**: Helmet, CORS, rate limiting, input validation

### Admin Panel
- **Dashboard**: Overview of products, categories, and statistics
- **Product Management**: Create, edit, delete, and manage product inventory
- **Category Management**: Organize products into categories
- **Image Management**: Upload and manage product images
- **User Authentication**: Secure admin login system
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Multer** - File uploads
- **bcryptjs** - Password hashing

### Admin Panel
- **React** - Frontend framework
- **React Router** - Client-side routing
- **React Query** - Server state management
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **React Hook Form** - Form handling
- **React Hot Toast** - Notifications

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### 1. Install Dependencies

```bash
# Backend dependencies
npm install

# Admin panel dependencies
cd admin-panel
npm install
cd ..
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/aphrodite
JWT_SECRET=your_very_long_and_secure_jwt_secret_key_here
ADMIN_EMAIL=admin@aphrodite.com
ADMIN_PASSWORD=admin123
CORS_ORIGIN=http://localhost:3000
```

### 3. Create Upload Directories

```bash
mkdir -p uploads/{products,categories}
```

### 4. Seed Database (Optional)

```bash
node src/utils/seed.js
```

This creates:
- Admin user with credentials from `.env`
- Sample categories (Clothing, Shoes, Accessories)
- Sample products with images and variants

### 5. Start the Application

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start

# Admin panel only (separate terminal)
npm run admin
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password

### Categories (Admin)
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category
- `PUT /api/categories/:id/toggle-status` - Toggle active status

### Products (Admin)
- `GET /api/products` - Get all products (with pagination)
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `PUT /api/products/:id/toggle-status` - Toggle active status
- `DELETE /api/products/:id/images/:imageIndex` - Remove specific image

### Public API (for Frontend)
- `GET /api/public/categories` - Get active categories
- `GET /api/public/products` - Get active products (with filters)
- `GET /api/public/products/:slug` - Get single product by slug
- `GET /api/public/featured` - Get featured products
- `GET /api/public/stats` - Get basic statistics

## Usage

### Accessing the Admin Panel

1. Start the server: `npm run dev`
2. Visit: `http://localhost:3001/admin`
3. Login with admin credentials:
   - Email: admin@aphrodite.com
   - Password: admin123 (or from .env)

### Creating Products

1. Go to Products → New Product
2. Fill in product details:
   - Name, description, price
   - Select category
   - Upload images
   - Add colors, sizes, tags
   - Set stock and SKU
3. Save the product

### Managing Categories

1. Go to Categories → New Category
2. Add category name and description
3. Upload category image (optional)
4. Set sort order
5. Save the category

### Frontend Integration

Use the public API endpoints to fetch data for your frontend:

```javascript
// Get all active categories
fetch('/api/public/categories')

// Get products with filters
fetch('/api/public/products?category=clothing&limit=12')

// Get featured products
fetch('/api/public/featured?limit=8')

// Get single product
fetch('/api/public/products/product-slug')
```

## File Structure

```
aphrodite-backend/
├── src/
│   ├── controllers/           # Route controllers
│   ├── models/               # MongoDB models
│   │   ├── User.js          # Admin user model
│   │   ├── Category.js      # Category model
│   │   └── Product.js       # Product model
│   ├── routes/              # API routes
│   │   ├── auth.js          # Authentication routes
│   │   ├── categories.js    # Category routes
│   │   ├── products.js      # Product routes
│   │   └── public.js        # Public API routes
│   ├── middleware/          # Custom middleware
│   │   └── auth.js          # Authentication middleware
│   ├── config/              # Configuration files
│   ├── utils/               # Utility functions
│   │   └── seed.js          # Database seeding
│   └── server.js            # Main server file
├── admin-panel/             # React admin panel
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── context/         # React context
│   │   └── App.js           # Main app component
│   └── public/              # Static files
├── uploads/                 # Upload directories
│   ├── products/            # Product images
│   └── categories/          # Category images
├── package.json             # Backend dependencies
├── .env.example             # Environment template
└── README.md               # This file
```

## Deployment

### Backend Deployment

1. Set production environment variables
2. Update CORS_ORIGIN to your frontend URL
3. Use a production MongoDB instance
4. Build admin panel: `cd admin-panel && npm run build`
5. Deploy to your server (Heroku, DigitalOcean, etc.)

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aphrodite
JWT_SECRET=your_production_jwt_secret
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure_admin_password
CORS_ORIGIN=https://yourdomain.com
```

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Request rate limiting
- CORS protection
- Input validation and sanitization
- Helmet security headers
- File upload restrictions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.