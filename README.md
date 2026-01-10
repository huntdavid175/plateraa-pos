# Plateraa POS - Restaurant Order Management System

A modern, mobile-first Point of Sale (POS) system for restaurant order management built with Next.js, React, and TypeScript.

## Features

- ✅ **Mobile & Tablet Optimized** - Touch-friendly interface with large tap targets (48px minimum)
- ✅ **Three-Column Layout** - Categories, Menu Grid, and Order Details
- ✅ **Order Management** - Support for Dine-in, Takeaway, and Delivery orders
- ✅ **Customer Management** - Customer lookup and creation with phone validation
- ✅ **Search & Filters** - Search menu items, filter by category, sort options
- ✅ **Payment Integration** - Support for Cash, Card, and Mobile Money payments
- ✅ **Real-time UI** - Optimistic updates and smooth animations
- ✅ **Local Storage** - Customer data persisted in browser storage

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Visit [http://localhost:3000/pos](http://localhost:3000/pos)

## Project Structure

```
plateraa-pos/
├── app/
│   ├── pos/
│   │   └── page.tsx          # Main POS page
│   ├── layout.tsx            # Root layout
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
│   ├── mock-data.ts          # Sample menu data
│   └── utils.ts              # Utility functions
└── types/
    └── index.ts             # TypeScript definitions
```

## Usage

### For Cashiers

1. **Browse Menu** - Use the category sidebar or search to find items
2. **Add Items** - Tap menu items to add them to the cart
3. **Select Order Type** - Choose Dine-in, Takeaway, or Delivery
4. **Enter Customer Info** - Add customer name and phone number
5. **Manage Cart** - Adjust quantities or remove items
6. **Place Order** - Select payment method and complete the order

### Customization

#### Menu Items
Edit `lib/mock-data.ts` to add or modify menu items and categories.

#### Colors
Update CSS variables in `app/globals.css`:
- Primary color: `#FF9800` (Orange)
- Modify `:root` section for theme customization

#### Tax Rate
Change `TAX_RATE` constant in `app/pos/page.tsx`:
```typescript
const TAX_RATE = 0.1; // 10% tax
```

## Data Storage

- **Menu Items & Categories**: Defined in `lib/mock-data.ts` (static data)
- **Customers**: Stored in browser localStorage (persists across sessions)
- **Orders**: Currently logged to console (can be extended to API)

## Browser Support

- Chrome/Edge (latest)
- Safari (latest)
- Firefox (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Technologies

- **Next.js 16** - React framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Radix UI** - Accessible components
- **Lucide React** - Icons

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Next Steps

To integrate with a backend:

1. Replace mock data in `lib/mock-data.ts` with API calls
2. Update `app/pos/page.tsx` to fetch menu data from your API
3. Update `components/pos/CustomerInfoForm.tsx` to use your customer API
4. Implement order submission in `handlePlaceOrder` function
5. Integrate payment gateway in `handleSendPaymentLink` function

## License

MIT
