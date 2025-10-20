# Aphrodite API - Bruno Collection

This is a complete Bruno API collection for testing all Aphrodite backend endpoints.

## Quick Start

1. **Install Bruno**: Download from [https://www.usebruno.com/](https://www.usebruno.com/)

2. **Import Collection**:
   - Open Bruno
   - Click "Open Collection"
   - Navigate to `aphrodite-backend/bruno-collection`
   - Select the folder

3. **Select Environment**:
   - Click the environment dropdown (top right)
   - Choose either:
     - `Local` - for testing localhost:3001
     - `Production` - for testing your Render deployment

4. **Login to Get Auth Token**:
   - Run the `02-Auth-Login` request
   - The token will be automatically saved to `{{authToken}}` variable
   - All authenticated requests will now work

## API Endpoints Included

### Authentication (3 endpoints)
- `01-Health-Check` - Test if API is running
- `02-Auth-Login` - Login and get JWT token (auto-saves token)
- `03-Auth-Get-Me` - Get current user info

### Categories (4 endpoints)
- `04-Categories-List` - Get all categories
- `05-Categories-Create` - Create new category
- `06-Categories-Update` - Update category (requires `{{categoryId}}`)
- `07-Categories-Delete` - Delete category (requires `{{categoryId}}`)

### Products (6 endpoints)
- `08-Products-List` - Get all products with pagination
- `09-Products-Get-By-ID` - Get product by ID (requires `{{productId}}`)
- `10-Products-Create` - Create new product (requires `{{categoryId}}`)
- `11-Products-Update` - Update product (requires `{{productId}}`)
- `12-Products-Delete` - Delete product (requires `{{productId}}`)
- `13-Products-Toggle-Status` - Toggle active/inactive (requires `{{productId}}`)

### Orders (5 endpoints)
- `14-Orders-List` - Get all orders
- `15-Orders-Create` - Create new order (public endpoint)
- `16-Orders-Get-By-ID` - Get order by ID (requires `{{orderId}}`)
- `17-Orders-Update-Status` - Update order status (requires `{{orderId}}`)
- `18-Orders-Delete` - Delete order (requires `{{orderId}}`)

### Customers (1 endpoint)
- `19-Customers-List` - Get all customers with stats

### Dashboard (2 endpoints)
- `20-Dashboard-Stats` - Get dashboard overview statistics
- `21-Dashboard-Sales-Analytics` - Get sales analytics with date range

### Public Endpoints (4 endpoints)
- `22-Public-Categories` - Get active categories (no auth)
- `23-Public-Products` - Get active products with filters (no auth)
- `24-Public-Product-By-Slug` - Get product by slug (requires `{{productSlug}}`)
- `25-Public-Featured-Products` - Get featured products (no auth)

### Settings (2 endpoints)
- `26-Settings-Hero-Get` - Get hero section settings
- `27-Settings-Hero-Update` - Update hero text content

## Environment Variables

Both environments have these variables:
- `baseUrl` - API base URL (auto-configured)
- `authToken` - JWT token (auto-populated after login)
- `categoryId` - Category ID for testing (set manually)
- `productId` - Product ID for testing (set manually)
- `productSlug` - Product slug for testing (set manually)
- `orderId` - Order ID for testing (set manually)

## Testing Workflow

### Basic Test Flow:
1. Run `01-Health-Check` to verify API is running
2. Run `02-Auth-Login` to get authenticated
3. Create a category with `05-Categories-Create`
4. Copy the category `_id` from response
5. Set `{{categoryId}}` in environment variables
6. Create a product with `10-Products-Create`
7. Test other endpoints as needed

### Production Testing:
1. Switch to `Production` environment
2. Run `02-Auth-Login` with production credentials
3. Test all endpoints against your Render deployment

## Default Credentials

- Email: `admin@aphrodite.com`
- Password: `admin123`

## Notes

- File uploads (images) are not included in this collection
- To test file uploads, use the multipart/form-data format in Bruno
- Some endpoints require IDs from previous requests (create → get → update → delete workflow)
- Public endpoints don't require authentication
- Admin endpoints require the `Authorization: Bearer {{authToken}}` header (auto-configured)
