# Quick Start Guide

## 1. Install Dependencies

All dependencies are already installed. If you need to reinstall:

```bash
npm install
```

## 2. Set Up Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings > API
3. Create `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

## 3. Set Up Database

1. Open Supabase SQL Editor
2. Copy and run the SQL from `POS_SETUP.md` (Database Schema section)
3. Insert sample data (also in `POS_SETUP.md`)

## 4. Run the Application

```bash
npm run dev
```

Visit: [http://localhost:3000/pos](http://localhost:3000/pos)

## 5. Test the POS

1. Browse menu items
2. Add items to cart
3. Select order type (Dine-in/Takeaway/Delivery)
4. Enter customer information
5. Place order

## Key Features

- ✅ Mobile/Tablet optimized
- ✅ Real-time menu updates
- ✅ Customer management
- ✅ Payment link integration
- ✅ Search and filters
- ✅ Offline detection

## File Structure

- `app/pos/page.tsx` - Main POS page
- `components/pos/` - All POS components
- `lib/supabase.ts` - Supabase client
- `types/index.ts` - TypeScript types

## Next Steps

1. Customize colors in `app/globals.css`
2. Integrate payment gateway in `app/pos/page.tsx` (handleSendPaymentLink)
3. Add authentication if needed
4. Deploy to production

For detailed setup, see `POS_SETUP.md`.

