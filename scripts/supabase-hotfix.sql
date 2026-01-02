-- Quick hotfix to align Supabase schema with app expectations.
-- Run this once in Supabase SQL editor or psql.

-- 1) Categories: add slug/icon/display_order.
ALTER TABLE IF EXISTS public.categories
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS icon text,
  ADD COLUMN IF NOT EXISTS display_order int;

-- Backfill display_order from order_index if present.
UPDATE public.categories
SET display_order = COALESCE(display_order, order_index, 0)
WHERE display_order IS NULL;

-- 2) Products: add columns used by UI.
ALTER TABLE IF EXISTS public.products
  ADD COLUMN IF NOT EXISTS old_price decimal(10,2),
  ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS featured_image text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'approved';

-- 3) Users: add role alias for user_role.
ALTER TABLE IF EXISTS public.users
  ADD COLUMN IF NOT EXISTS role text;
UPDATE public.users SET role = user_role WHERE role IS NULL;

-- 4) Vendors: add commonly used columns.
ALTER TABLE IF EXISTS public.vendors
  ADD COLUMN IF NOT EXISTS store_name text,
  ADD COLUMN IF NOT EXISTS store_name_ar text,
  ADD COLUMN IF NOT EXISTS shop_name text,
  ADD COLUMN IF NOT EXISTS shop_name_ar text,
  ADD COLUMN IF NOT EXISTS shop_logo text,
  ADD COLUMN IF NOT EXISTS rating decimal(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reviews_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS latitude decimal(10,6),
  ADD COLUMN IF NOT EXISTS longitude decimal(10,6),
  ADD COLUMN IF NOT EXISTS min_order_amount decimal(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'approved';

UPDATE public.vendors SET
  store_name = COALESCE(store_name, vendor_name),
  shop_name = COALESCE(shop_name, vendor_name),
  shop_logo = COALESCE(shop_logo, logo_url)
WHERE vendor_name IS NOT NULL;

-- 5) Wishlists / cart items tables (in case not created).
CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity int NOT NULL CHECK (quantity > 0),
  added_at timestamptz DEFAULT now(),
  UNIQUE(customer_id, product_id, vendor_id),
  FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_cart_items_customer_id ON public.cart_items(customer_id);

CREATE TABLE IF NOT EXISTS public.wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  product_id uuid NOT NULL,
  added_at timestamptz DEFAULT now(),
  UNIQUE(customer_id, product_id),
  FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_wishlists_customer_id ON public.wishlists(customer_id);

-- 6) Chats table (minimal shape to satisfy UI).
CREATE TABLE IF NOT EXISTS public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  last_message text,
  last_message_at timestamptz,
  last_message_sender_id uuid,
  is_active boolean DEFAULT true,
  customer_unread_count int DEFAULT 0,
  vendor_unread_count int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_chats_customer_id ON public.chats(customer_id);
CREATE INDEX IF NOT EXISTS idx_chats_vendor_id ON public.chats(vendor_id);

-- 7) Store followers table (for followed stores).
CREATE TABLE IF NOT EXISTS public.store_followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, vendor_id),
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_store_followers_user_id ON public.store_followers(user_id);
CREATE INDEX IF NOT EXISTS idx_store_followers_vendor_id ON public.store_followers(vendor_id);

-- 8) RPC stubs for exchange rates and unread count to stop 404s.
CREATE OR REPLACE FUNCTION public.get_latest_exchange_rates()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT '{}'::jsonb;
$$;

CREATE OR REPLACE FUNCTION public.update_exchange_rates(p_rates jsonb, p_source text)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- TODO: persist rates to a table; stub to satisfy client.
  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_unread_count()
RETURNS int
LANGUAGE sql
STABLE
AS $$
  SELECT 0;
$$;

-- 9) Ensure RLS is enabled where expected.
ALTER TABLE IF EXISTS public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.store_followers ENABLE ROW LEVEL SECURITY;

-- Basic permissive policies (adjust for production security!).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cart_items' AND policyname = 'cart_items_rw'
  ) THEN
    CREATE POLICY cart_items_rw ON public.cart_items FOR ALL USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'wishlists' AND policyname = 'wishlists_rw'
  ) THEN
    CREATE POLICY wishlists_rw ON public.wishlists FOR ALL USING (auth.uid() = customer_id) WITH CHECK (auth.uid() = customer_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'chats' AND policyname = 'chats_rw'
  ) THEN
    CREATE POLICY chats_rw ON public.chats FOR ALL USING (
      auth.uid() = customer_id OR auth.uid() = vendor_id
    ) WITH CHECK (
      auth.uid() = customer_id OR auth.uid() = vendor_id
    );
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'store_followers' AND policyname = 'store_followers_rw'
  ) THEN
    CREATE POLICY store_followers_rw ON public.store_followers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- 10) Timestamp triggers for new tables.
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_chats_timestamp ON public.chats;
CREATE TRIGGER update_chats_timestamp BEFORE UPDATE ON public.chats FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();
