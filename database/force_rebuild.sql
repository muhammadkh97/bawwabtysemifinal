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
  phone TEXT,
  role user_role NOT NULL DEFAULT 'customer',
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
  name_ar TEXT,
  description TEXT,
  business_type business_type NOT NULL DEFAULT 'retail',
  category TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  lat FLOAT8,
  lng FLOAT8,
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
  banner_url TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_sales DECIMAL(10,2) DEFAULT 0,
  total_products INTEGER DEFAULT 0,
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

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
  RAISE NOTICE '📊 Tables created: users, stores, products, orders, drivers, reviews, notifications';
  RAISE NOTICE '🔒 RLS policies applied';
  RAISE NOTICE '🌱 Initial categories seeded';
  RAISE NOTICE '⚠️  Next steps: Run Supabase type generation with: npx supabase gen types typescript --local > types/supabase.ts';
END $$;
