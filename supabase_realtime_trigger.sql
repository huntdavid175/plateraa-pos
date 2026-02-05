-- ============================================
-- Supabase Realtime Trigger for Orders Table
-- ============================================
-- 
-- This is an ALTERNATIVE approach if postgres_changes doesn't work.
-- You typically DON'T need this if replication is enabled and working.
-- 
-- Use this ONLY if:
-- 1. You've enabled replication for the orders table, AND
-- 2. The postgres_changes subscription still isn't receiving events
--
-- ============================================

-- Step 1: Enable the realtime extension (if not already enabled)
-- This is usually enabled by default in Supabase, but check if needed:
-- CREATE EXTENSION IF NOT EXISTS realtime;

-- Step 2: Grant necessary permissions (if using authenticated users)
-- Uncomment and adjust if you're using authentication:
-- CREATE POLICY "Authenticated users can receive broadcasts"
-- ON "realtime"."messages"
-- FOR SELECT
-- TO authenticated
-- USING ( true );

-- Step 3: Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_orders_changes()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM realtime.broadcast_changes(
    'orders_changes',                    -- topic - the channel name clients will listen to
    TG_OP,                               -- event - INSERT, UPDATE, or DELETE
    TG_OP,                               -- operation - same as event
    TG_TABLE_NAME,                       -- table - 'orders'
    TG_TABLE_SCHEMA,                     -- schema - 'public'
    NEW,                                 -- new record - the record after the change
    OLD                                  -- old record - the record before the change
  );
  RETURN NULL;
END;
$$;

-- Step 4: Create the trigger
DROP TRIGGER IF EXISTS handle_orders_changes_trigger ON public.orders;

CREATE TRIGGER handle_orders_changes_trigger
AFTER INSERT OR UPDATE OR DELETE
ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_orders_changes();

-- ============================================
-- To use this trigger-based approach in your code:
-- ============================================
-- Change the subscription in app/kitchen/page.tsx from:
--   .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, ...)
-- 
-- To:
--   .on("broadcast", { event: "orders_changes" }, ...)
--
-- The payload structure will be slightly different, so you'll need to adjust
-- the handler accordingly.
-- ============================================
