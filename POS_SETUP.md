# POS System Setup Guide

## Overview

This is a comprehensive Point of Sale (POS) system for restaurant order management, built with Next.js, React, TypeScript, and Supabase. It's optimized for mobile and tablet devices (iPad, Android tablets, large phones).

## Features

- ✅ Mobile and tablet-friendly interface
- ✅ Touch-optimized with large tap targets (48px minimum)
- ✅ Real-time menu updates from Supabase
- ✅ Three-column responsive layout
- ✅ Order management (Dine-in, Takeaway, Delivery)
- ✅ Customer management with auto-suggest
- ✅ Payment link integration
- ✅ Search and filter menu items
- ✅ Special instructions for orders
- ✅ Offline detection
- ✅ Toast notifications

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Next.js 16+

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Set up Supabase database (see SQL schema below)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000/pos](http://localhost:3000/pos) in your browser

## Supabase Database Schema

Run the following SQL in your Supabase SQL editor:

```sql
-- Menu Categories Table
CREATE TABLE IF NOT EXISTS menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Menu Items Table
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  category_id UUID REFERENCES menu_categories(id) ON DELETE SET NULL,
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  preparation_time INTEGER, -- in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  phone VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) NOT NULL UNIQUE,
  order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('dine-in', 'takeaway', 'delivery')),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  table_number VARCHAR(10),
  delivery_address TEXT,
  items JSONB NOT NULL, -- Array of order items
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_rate DECIMAL(5, 4) NOT NULL DEFAULT 0.1,
  tax_amount DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled')),
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'mobile_money')),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  payment_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_available ON menu_items(is_available);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- Enable Row Level Security (RLS) - adjust policies as needed
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Example policies (adjust based on your security needs)
-- Allow public read access to menu items and categories
CREATE POLICY "Public read access for menu_categories" ON menu_categories FOR SELECT USING (true);
CREATE POLICY "Public read access for menu_items" ON menu_items FOR SELECT USING (true);

-- Allow authenticated users to manage customers and orders
CREATE POLICY "Users can insert customers" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update customers" ON customers FOR UPDATE USING (true);
CREATE POLICY "Users can insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update orders" ON orders FOR UPDATE USING (true);
```

## Sample Data

Insert some sample data to test:

```sql
-- Insert sample categories
INSERT INTO menu_categories (name, slug, display_order) VALUES
  ('Appetizer', 'appetizer', 1),
  ('Soup', 'soup', 2),
  ('Beverages', 'beverages', 3),
  ('Salad', 'salad', 4);

-- Insert sample menu items
INSERT INTO menu_items (name, description, price, category_id, is_available, is_featured) VALUES
  ('Onigiri', 'Japanese rice balls with various fillings', 12.90, (SELECT id FROM menu_categories WHERE slug = 'appetizer'), true, true),
  ('Songpyeon', 'Traditional Korean rice cakes', 4.90, (SELECT id FROM menu_categories WHERE slug = 'appetizer'), true, true),
  ('Miso Soup', 'Traditional Japanese soup', 5.50, (SELECT id FROM menu_categories WHERE slug = 'soup'), true, false),
  ('Green Tea', 'Premium Japanese green tea', 3.50, (SELECT id FROM menu_categories WHERE slug = 'beverages'), true, false);
```

## Project Structure

```
plateraa-pos/
├── app/
│   ├── pos/
│   │   └── page.tsx          # Main POS page
│   ├── layout.tsx            # Root layout with Toaster
│   └── globals.css           # Global styles
├── components/
│   ├── ui/                   # shadcn/ui components
│   └── pos/                  # POS-specific components
│       ├── CategorySidebar.tsx
│       ├── MenuGrid.tsx
│       ├── MenuItemCard.tsx
│       ├── OrderItem.tsx
│       ├── OrderSidebar.tsx
│       ├── CustomerInfoForm.tsx
│       └── PaymentDialog.tsx
├── lib/
│   ├── supabase.ts          # Supabase client
│   └── utils.ts              # Utility functions
├── types/
│   └── index.ts             # TypeScript type definitions
└── package.json
```

## Usage

### For Cashiers

1. **View Menu**: Browse menu items by category or search
2. **Add Items**: Tap on menu items to add them to the cart
3. **Select Order Type**: Choose Dine-in, Takeaway, or Delivery
4. **Enter Customer Info**: 
   - Customer name (required)
   - Phone number (required, validates Nigerian format)
   - Table number (for dine-in)
   - Delivery address (for delivery)
5. **Manage Cart**: Adjust quantities or remove items
6. **Place Order**: 
   - For cash: Mark as paid and send to kitchen
   - For card/mobile money: Send payment link to customer

### Features

- **Search**: Type in the search bar to find menu items
- **Filter**: Filter by category, availability, and sort options
- **Real-time Updates**: Menu availability updates in real-time
- **Offline Mode**: System detects offline status and shows indicator

## Customization

### Colors

Edit `app/globals.css` to customize colors:
- Primary color: `#FF9800` (Orange)
- Update CSS variables in `:root` section

### Tax Rate

Edit `TAX_RATE` constant in `app/pos/page.tsx`:
```typescript
const TAX_RATE = 0.1; // 10% tax
```

### Payment Link Integration

Update `handleSendPaymentLink` function in `app/pos/page.tsx` to integrate with your payment gateway (e.g., Paystack, Flutterwave).

## Troubleshooting

### Menu not loading
- Check Supabase connection in `.env.local`
- Verify RLS policies allow read access
- Check browser console for errors

### Images not displaying
- Ensure image URLs are valid
- Check Next.js image configuration in `next.config.ts`
- Verify image domains are allowed

### Payment link not sending
- Implement your payment gateway integration
- Check customer phone number format
- Verify SMS/Email service configuration

## Browser Support

- Chrome/Edge (latest)
- Safari (latest)
- Firefox (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- Lazy loading for menu images
- Optimistic UI updates
- Debounced search
- Efficient state management

## Security Notes

- Adjust RLS policies based on your security requirements
- Never expose service role keys in client-side code
- Validate all user inputs
- Implement proper authentication for production use

## Next Steps

1. Set up authentication (Supabase Auth)
2. Integrate payment gateway (Paystack, Flutterwave, etc.)
3. Add order history view
4. Implement kitchen display system
5. Add reporting and analytics
6. Set up SMS/Email notifications

## Support

For issues or questions, check the code comments or create an issue in the repository.

