# Food Ordering System - Multi Shop Implementation

This document summarizes the changes made to implement a multi-shop food delivery system.

## Instructions for Running the Project

### Environment Setup
1. Ensure Node.js and MongoDB are installed on your system

### Installation
1. Clone the repository
2. Navigate to the project root directory
3. Install dependencies:
```bash
cd frontend && npm install
cd ../backend && npm install
```

### Running the Application
1. Start MongoDB service
2. Start the backend server:
```bash
cd backend
npm start
```
3. Start the frontend development server:
```bash
cd frontend
npm start
```

## Implementation Instructions

1. First implement the backend changes:
   - Create the shop model
   - Update food model to include shop reference
   - Add shop routes
   - Update food routes to handle shop association

2. Then implement the frontend services:
   - Create shop service for API calls
   - Update food service to include shop-related methods

3. Update the frontend components/pages:
   - Modify homepage to show shops
   - Create shop page to show shop details and food items
   - Add shop management to admin dashboard
   - Update cart system to handle per-shop orders

4. Test the changes:
   - Test CRUD operations for shops
   - Test food-shop associations
   - Test cart functionality with multiple shops
   - Test order flow with shop information

## Code Changes

### 1. Backend Changes

#### Models

1. **Shop Model** (`/backend/src/models/shop.model.js`):
   - Added schema with fields:
     - name (required)
     - description (required) 
     - imageUrl (required)
     - address (required)
     - tags (array)
     - stars (default: 3)
   - Timestamps enabled
   - Virtual fields for managing relationships

2. **Food Model** Updates:
   - Added shop reference field
   - Associated each food item with a specific shop
   - Updated indexes and validations

#### Routers

1. **Shop Router** (`/backend/src/routers/shop.router.js`):
   ```javascript
   // Basic CRUD routes
   GET / - Get all shops
   GET /tags - Get shop tags
   GET /search/:searchTerm - Search shops
   GET /tag/:tag - Get shops by tag
   GET /:shopId - Get shop by ID
   GET /:shopId/foods - Get foods by shop
   
   // Admin routes (protected)
   POST / - Create shop
   PUT /:shopId - Update shop
   DELETE /:shopId - Delete shop
   ```

2. **Food Router Updates**:
   - Enhanced routes to handle shop association
   - Added shop-specific endpoints
   - Modified to include shop data in responses
   - Updated create/update to handle shop association

### 2. Frontend Changes

#### Services

1. **Shop Service** (`/frontend/src/services/shopService.js`):
   - Added API methods for:
     - CRUD operations
     - Search and filtering
     - Tag operations
     - Food association

2. **Food Service** Updates:
   - Added shop-related methods
   - Updated CRUD operations to handle shop data
   - Updated response handling

#### Components and Pages

1. **Home Page** (`/frontend/src/pages/Home/HomePage.js`):
   - Modified to display shop grid instead of foods
   - Added shop search and filtering
   - Added shop tags

2. **Shop Page** (`/frontend/src/pages/Shop/ShopPage.js`):
   - Created new page to display:
     - Shop details
     - Shop menu (food items)
     - Shop ratings and info

3. **Admin Dashboard**:
   - Added "Manage Shops" section 
   - Created shop management components:
     - ManageShops.js
     - ShopForm.js
   - Updated food management to include shop selection

4. **Cart System Updates**:
   - Modified to handle per-shop carts
   - Updated cart display to group by shop
   - Added shop information to orders

#### Components

1. `ManageFoods` component
   - Added shop selection dropdown
   - Updated food form with shop field
   - Added filtering by shop

2. `ManageShops` component (new)
   - CRUD operations for shops
   - Image preview
   - Validation
   - Error handling

3. `FoodForm` component (updated)
   - Added shop selection field
   - Enhanced validation
   - Error handling for shop-related fields

4. `ShopForm` component (new)
   - Form for creating/editing shops
   - Validation for required fields
   - Image URL preview
   - Tag management

5. `HomePage` (updated)
   - Now displays shops instead of foods
   - Grid layout for shop cards
   - Shop filtering by tags

6. `ShopPage` (new)
   - Shows shop details
   - Lists foods from the shop
   - Rating and tags display

#### State Management

1. Cart System (updated)
   - Modified to support multiple shops
   - Added shop-specific cart management
   - Prevents mixing items from different shops

### 3. UI/UX Improvements

1. **Layout**:
   - Added shop cards on homepage
   - Created shop detail page layout
   - Updated admin interface

2. **Components**:
   - Modified Thumbnails to handle both shops and foods
   - Updated cart display for multi-shop support
   - Enhanced admin forms

3. Shop Management
   - Clean, intuitive interface for managing shops
   - Image previews
   - Validation feedback
   - Success/error notifications

4. Food Management
   - Shop context for food items
   - Improved form validation
   - Better error handling

5. Shopping Experience
   - Shop-based navigation
   - Clear shop context in cart
   - Improved order tracking

6. Admin Dashboard
   - Separate sections for shops and foods
   - Quick access to management features
   - Better data organization

### 4. Assets

1. Added shop images:
   - asian-shop.jpg
   - burger-shop.jpg
   - pizza-shop.jpg

### 5. Error Handling

1. Improved validation:
   - Shop existence checks
   - Food-shop association validation
   - Delete protection for shops with foods

2. User feedback:
   - Clear error messages
   - Loading states
   - Success notifications

## Design Changes

### Homepage

1. Changed layout to show shop cards instead of food items
2. Added shop filtering and search
3. Updated tags to show shop categories

### Shop Page

1. Added shop header with:
   - Shop image
   - Name and description
   - Address and tags
   - Rating

2. Added menu section showing shop's food items

### Admin Dashboard

1. Added shop management section with:
   - Shop listing table
   - Create/edit shop form
   - Food-shop association management

### Cart/Checkout Flow  

1. Modified cart to handle multiple shops:
   - Separate cart sections per shop
   - Shop-specific checkout
   - Clear cart by shop

## Key Files Changed

1. Backend:
   - models/shop.model.js (new)
   - routers/shop.router.js (new)
   - models/food.model.js (updated)
   - routers/food.router.js (updated)

2. Frontend:
   - services/shopService.js (new)
   - pages/Shop/ShopPage.js (new)
   - pages/Admin/ManageShops/* (new directory)
   - pages/Home/HomePage.js (updated)
   - components/Thumbnails/Thumbnails.js (updated)
   - hooks/useCart.js (updated)

## Testing Instructions

1. Shop Management:
   - Create new shops
   - Edit existing shops
   - Delete shops (check food item handling)
   - Test shop search and filtering

2. Food Management:
   - Create foods with shop association
   - Edit foods to change shops
   - Test food listing by shop

3. Cart/Order Flow:
   - Add items from multiple shops
   - Test per-shop checkout
   - Verify shop info in orders

4. User Experience:
   - Test shop navigation
   - Verify cart separation
   - Check order history with shop info

## Known Issues

1. Cart clearing required when switching shops
2. Shop deletion requires manual food reassignment
3. Image upload functionality pending (currently using URLs)

## Future Improvements

1. Image upload capability
2. Bulk operations for foods and shops
3. Advanced shop filtering and sorting
4. Shop analytics and reporting
5. Shop owner accounts and permissions

## Notes

1. Database Relationships:
   - One-to-Many between Shop and Food
   - Shop deletion restricted if foods exist

2. Security:
   - Shop management restricted to admin
   - Public shop views for all users

3. Performance:
   - Paginated shop/food loading
   - Optimized shop-food queries

## Security Considerations

1. Admin-only shop management
2. Validation of shop-food relationships
3. Protection against unauthorized modifications