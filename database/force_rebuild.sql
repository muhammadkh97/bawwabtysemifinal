-- ==========================================
-- BAWWABTY FORCE REBUILD - COMPLETE RESET
-- ==========================================
-- WARNING: This script will PERMANENTLY DELETE all data
-- Only run this in development environment
-- ==========================================

-- Step 1: Drop everything and start fresh
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Step 2: Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ==========================================
-- ENUMS: Define all enumeration types
-- ==========================================

CREATE TYPE user_role AS ENUM ('customer', 'vendor', 'driver', 'admin');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE business_type AS ENUM ('retail', 'restaurant');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'preparing', 'ready', 'shipped', 'out_for_delivery', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'wallet');
CREATE TYPE product_status AS ENUM ('draft', 'pending', 'approved', 'rejected');
CREATE TYPE delivery_status AS ENUM ('idle', 'assigned', 'picked_up', 'delivering', 'completed');

-- ==========================================
-- CORE TABLES
-- ==========================================

-- Users Table (Core authentication and profile)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  user_role TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  vendor_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stores Table (Hybrid: Retail + Restaurant)
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  store_name TEXT,
  shop_name TEXT,
  name_ar TEXT,
  shop_name_ar TEXT,
  description TEXT,
  business_type business_type NOT NULL DEFAULT 'retail',
  vendor_type TEXT,
  category TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  lat FLOAT8,
  latitude FLOAT8,
  lng FLOAT8,
  longitude FLOAT8,
  location GEOGRAPHY(POINT, 4326),
  opening_hours JSONB DEFAULT '{"monday": "9:00-22:00", "tuesday": "9:00-22:00", "wednesday": "9:00-22:00", "thursday": "9:00-22:00", "friday": "9:00-22:00", "saturday": "9:00-22:00", "sunday": "9:00-22:00"}',
  is_online BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  approval_status approval_status DEFAULT 'pending',
  commission_rate DECIMAL(4,2) DEFAULT 10.00,
  documents TEXT[] DEFAULT '{}',
  wallet_balance DECIMAL(10,2) DEFAULT 0,
  bank_account JSONB,
  theme_preference TEXT DEFAULT 'white',
  logo_url TEXT,
  shop_logo TEXT,
  banner_url TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  reviews_count INTEGER,
  total_orders INTEGER DEFAULT 0,
  total_sales DECIMAL(10,2) DEFAULT 0,
  total_products INTEGER DEFAULT 0,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_coordinates CHECK (lat >= -90 AND lat <= 90 AND lng >= -180 AND lng <= 180)
);

-- Create spatial index for location-based queries
CREATE INDEX idx_stores_location ON stores USING GIST(location);
CREATE INDEX idx_stores_business_type ON stores(business_type);
CREATE INDEX idx_stores_is_online ON stores(is_online);

-- Categories Table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  requires_approval BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products Table (Unified for Retail + Restaurant Meals)
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  description TEXT,
  slug TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  old_price DECIMAL(10,2),
  original_currency TEXT DEFAULT 'SAR',
  stock INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  images TEXT[] DEFAULT '{}',
  featured_image TEXT,
  status product_status DEFAULT 'approved',
  is_active BOOLEAN DEFAULT true,
  has_variants BOOLEAN DEFAULT false,
  variants JSONB,
  attributes JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  rating DECIMAL(2,1) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_sales INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT positive_price CHECK (price >= 0),
  CONSTRAINT positive_stock CHECK (stock >= 0)
);

CREATE INDEX idx_products_vendor ON products(vendor_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_active ON products(is_active);

-- Orders Table (Unified for all order types)
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Order details
  items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'SAR',
  
  -- Status tracking
  status order_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  payment_method payment_method DEFAULT 'cash',
  
  -- Delivery information
  delivery_address TEXT,
  delivery_lat FLOAT8,
  delivery_lng FLOAT8,
  delivery_location GEOGRAPHY(POINT, 4326),
  delivery_notes TEXT,
  delivery_time TIMESTAMPTZ,
  estimated_delivery TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  
  CONSTRAINT positive_amounts CHECK (subtotal >= 0 AND total >= 0)
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_vendor ON orders(vendor_id);
CREATE INDEX idx_orders_driver ON orders(driver_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_delivery_location ON orders USING GIST(delivery_location);

-- Order Status History
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  status order_status NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_status_history_order ON order_status_history(order_id);

-- Drivers Table
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  vehicle_type TEXT,
  vehicle_number TEXT,
  license_number TEXT,
  license_image TEXT,
  approval_status approval_status DEFAULT 'pending',
  status delivery_status DEFAULT 'idle',
  current_lat FLOAT8,
  current_lng FLOAT8,
  current_location GEOGRAPHY(POINT, 4326),
  is_available BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  rating DECIMAL(2,1) DEFAULT 0,
  total_deliveries INTEGER DEFAULT 0,
  wallet_balance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_drivers_user ON drivers(user_id);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_available ON drivers(is_available);
CREATE INDEX idx_drivers_location ON drivers USING GIST(current_location);

-- Reviews Table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  images TEXT[] DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reviews_vendor ON reviews(vendor_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_customer ON reviews(customer_id);

-- Notifications Table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- Chats Table (Conversations between customers and vendors)
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  vendor_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  customer_unread_count INTEGER DEFAULT 0,
  vendor_unread_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(customer_id, vendor_id)
);

CREATE INDEX idx_chats_customer ON chats(customer_id);
CREATE INDEX idx_chats_vendor ON chats(vendor_id);
CREATE INDEX idx_chats_last_message ON chats(last_message_at DESC);

-- Add foreign key constraint name for Supabase schema cache
ALTER TABLE chats 
  DROP CONSTRAINT IF EXISTS chats_vendor_id_fkey,
  ADD CONSTRAINT chats_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES stores(id) ON DELETE CASCADE;

-- Messages Table (Individual messages within chats)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_chat ON messages(chat_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- Cart Items Table
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  selected_variant JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT positive_quantity CHECK (quantity > 0)
);

CREATE INDEX idx_cart_items_user ON cart_items(user_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);

-- Wishlists Table
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_wishlists_user ON wishlists(user_id);
CREATE INDEX idx_wishlists_product ON wishlists(product_id);

-- Store Followers Table
CREATE TABLE store_followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  vendor_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, vendor_id)
);

CREATE INDEX idx_store_followers_user ON store_followers(user_id);
CREATE INDEX idx_store_followers_vendor ON store_followers(vendor_id);

-- Exchange Rates Table
CREATE TABLE exchange_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  base_currency TEXT NOT NULL DEFAULT 'SAR',
  rates JSONB NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exchange_rates_updated ON exchange_rates(updated_at DESC);

-- Create vendors view for backwards compatibility
CREATE VIEW vendors AS
SELECT 
  id,
  user_id,
  name AS store_name,
  name,
  name AS shop_name,
  name_ar AS shop_name_ar,
  name_ar,
  description,
  business_type AS vendor_type,
  business_type,
  category,
  phone,
  email,
  address,
  lat AS latitude,
  lat,
  lng AS longitude,
  lng,
  location,
  opening_hours,
  is_online,
  is_active,
  approval_status,
  commission_rate,
  documents,
  wallet_balance,
  bank_account,
  theme_preference,
  logo_url AS shop_logo,
  logo_url,
  banner_url,
  rating,
  total_reviews AS reviews_count,
  total_reviews,
  total_orders,
  total_sales,
  total_products,
  min_order_amount,
  is_featured,
  created_at,
  updated_at
FROM stores;

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to sync alias columns in users table
CREATE OR REPLACE FUNCTION sync_users_aliases()
RETURNS TRIGGER AS $$
BEGIN
  NEW.name = NEW.full_name;
  NEW.user_role = NEW.role::TEXT;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to sync alias columns in stores table
CREATE OR REPLACE FUNCTION sync_stores_aliases()
RETURNS TRIGGER AS $$
BEGIN
  NEW.store_name = NEW.name;
  NEW.shop_name = NEW.name;
  NEW.shop_name_ar = NEW.name_ar;
  NEW.vendor_type = NEW.business_type::TEXT;
  NEW.latitude = NEW.lat;
  NEW.longitude = NEW.lng;
  NEW.shop_logo = NEW.logo_url;
  NEW.reviews_count = NEW.total_reviews;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER sync_users_aliases_trigger BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION sync_users_aliases();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER sync_stores_aliases_trigger BEFORE INSERT OR UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION sync_stores_aliases();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to sync location geography from lat/lng
CREATE OR REPLACE FUNCTION sync_location_geography()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply location sync triggers
CREATE TRIGGER sync_stores_location BEFORE INSERT OR UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION sync_location_geography();

CREATE TRIGGER sync_orders_location BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW WHEN (NEW.delivery_lat IS NOT NULL AND NEW.delivery_lng IS NOT NULL)
  EXECUTE FUNCTION sync_location_geography();

CREATE TRIGGER sync_drivers_location BEFORE INSERT OR UPDATE ON drivers
  FOR EACH ROW WHEN (NEW.current_lat IS NOT NULL AND NEW.current_lng IS NOT NULL)
  EXECUTE FUNCTION sync_location_geography();

-- Function to generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number = 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('order_number_seq')::TEXT, 6, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

CREATE TRIGGER set_order_number BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Function: Get current user details
CREATE OR REPLACE FUNCTION get_current_user()
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role user_role,
  phone TEXT,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email, u.full_name, u.role, u.phone, u.avatar_url
  FROM users u
  WHERE u.id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get latest exchange rates
CREATE OR REPLACE FUNCTION get_latest_exchange_rates()
RETURNS TABLE (
  rates JSONB,
  source TEXT,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT er.rates, er.source, er.updated_at
  FROM exchange_rates er
  ORDER BY er.updated_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function: Update exchange rates
CREATE OR REPLACE FUNCTION update_exchange_rates(p_rates JSONB, p_source TEXT)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO exchange_rates (base_currency, rates, source, updated_at)
  VALUES ('SAR', p_rates, p_source, NOW())
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Get unread notification count
CREATE OR REPLACE FUNCTION get_unread_count()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM notifications
  WHERE user_id = auth.uid() AND is_read = false;
  
  RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_followers ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Stores policies
CREATE POLICY "Anyone can view active stores" ON stores FOR SELECT USING (is_active = true);
CREATE POLICY "Vendors can manage own store" ON stores FOR ALL USING (auth.uid() = user_id);

-- Products policies
CREATE POLICY "Anyone can view approved products" ON products FOR SELECT USING (status = 'approved' AND is_active = true);
CREATE POLICY "Vendors can manage own products" ON products FOR ALL 
  USING (vendor_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

-- Orders policies
CREATE POLICY "Customers can view own orders" ON orders FOR SELECT 
  USING (customer_id = auth.uid());
CREATE POLICY "Vendors can view store orders" ON orders FOR SELECT 
  USING (vendor_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Drivers can view assigned orders" ON orders FOR SELECT 
  USING (driver_id = auth.uid());
CREATE POLICY "Customers can create orders" ON orders FOR INSERT 
  WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Vendors can update store orders" ON orders FOR UPDATE 
  USING (vendor_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Drivers can update assigned orders" ON orders FOR UPDATE 
  USING (driver_id = auth.uid());

-- Drivers policies
CREATE POLICY "Anyone can view active drivers" ON drivers FOR SELECT USING (is_active = true);
CREATE POLICY "Drivers can update own profile" ON drivers FOR UPDATE 
  USING (user_id = auth.uid());

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Customers can create reviews" ON reviews FOR INSERT 
  WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Customers can update own reviews" ON reviews FOR UPDATE 
  USING (customer_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT 
  USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE 
  USING (user_id = auth.uid());

-- Chats policies
CREATE POLICY "Customers can view own chats" ON chats FOR SELECT 
  USING (customer_id = auth.uid());
CREATE POLICY "Vendors can view store chats" ON chats FOR SELECT 
  USING (vendor_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Users can create chats" ON chats FOR INSERT 
  WITH CHECK (customer_id = auth.uid());
CREATE POLICY "Users can update own chats" ON chats FOR UPDATE 
  USING (customer_id = auth.uid() OR vendor_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

-- Messages policies
CREATE POLICY "Users can view chat messages" ON messages FOR SELECT 
  USING (chat_id IN (
    SELECT id FROM chats 
    WHERE customer_id = auth.uid() 
    OR vendor_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  ));
CREATE POLICY "Users can send messages" ON messages FOR INSERT 
  WITH CHECK (sender_id = auth.uid());

-- Cart items policies
CREATE POLICY "Users can view own cart" ON cart_items FOR SELECT 
  USING (user_id = auth.uid());
CREATE POLICY "Users can manage own cart" ON cart_items FOR ALL 
  USING (user_id = auth.uid());

-- Wishlists policies
CREATE POLICY "Users can view own wishlist" ON wishlists FOR SELECT 
  USING (user_id = auth.uid());
CREATE POLICY "Users can manage own wishlist" ON wishlists FOR ALL 
  USING (user_id = auth.uid());

-- Store followers policies
CREATE POLICY "Users can view own follows" ON store_followers FOR SELECT 
  USING (user_id = auth.uid());
CREATE POLICY "Users can manage own follows" ON store_followers FOR ALL 
  USING (user_id = auth.uid());

-- ==========================================
-- INITIAL DATA SEEDS
-- ==========================================

-- Insert default categories
INSERT INTO categories (name, name_ar, slug, icon, requires_approval) VALUES
  ('Electronics', 'إلكترونيات', 'electronics', '📱', false),
  ('Fashion', 'أزياء', 'fashion', '👕', false),
  ('Food & Beverages', 'أطعمة ومشروبات', 'food-beverages', '🍔', false),
  ('Home & Garden', 'منزل وحديقة', 'home-garden', '🏠', false),
  ('Health & Beauty', 'صحة وجمال', 'health-beauty', '💄', true),
  ('Sports', 'رياضة', 'sports', '⚽', false),
  ('Books', 'كتب', 'books', '📚', false),
  ('Toys', 'ألعاب', 'toys', '🧸', false);

-- ==========================================
-- GRANT PERMISSIONS
-- ==========================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ==========================================
-- COMPLETION MESSAGE
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database rebuild completed successfully!';
  RAISE NOTICE '📊 Tables created: users, stores, products, orders, drivers, reviews, notifications, chats, messages, cart_items, wishlists, store_followers, exchange_rates';
  RAISE NOTICE '�️  View created: vendors (maps to stores table for backwards compatibility)';
  RAISE NOTICE '🔒 RLS policies applied';
  RAISE NOTICE '🌱 Initial categories seeded';
  RAISE NOTICE '⚡ Functions created: get_current_user, get_latest_exchange_rates, update_exchange_rates, get_unread_count';
  RAISE NOTICE '🔄 Alias columns auto-synced via triggers: users.name, users.user_role, stores.store_name, stores.shop_name, stores.latitude, stores.longitude, stores.shop_logo';
  RAISE NOTICE '⚠️  Next steps: Run Supabase type generation with: npx supabase gen types typescript --local > types/supabase.ts';
END $$;
