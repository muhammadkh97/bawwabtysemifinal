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

CREATE TYPE user_role AS ENUM ('customer', 'vendor', 'driver', 'admin', 'restaurant');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE business_type AS ENUM ('retail', 'restaurant');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'preparing', 'ready', 'shipped', 'out_for_delivery', 'delivered', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'wallet');
CREATE TYPE product_status AS ENUM ('draft', 'pending', 'approved', 'rejected');
CREATE TYPE delivery_status AS ENUM ('idle', 'pending', 'assigned', 'picked_up', 'delivering', 'completed');

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
  loyalty_points INTEGER DEFAULT 0,
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
  bank_name TEXT,
  account_number TEXT,
  iban TEXT,
  notifications_email BOOLEAN DEFAULT true,
  notifications_sms BOOLEAN DEFAULT true,
  notifications_orders BOOLEAN DEFAULT true,
  notifications_reviews BOOLEAN DEFAULT true,
  notifications_messages BOOLEAN DEFAULT true,
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

-- Addresses Table (User delivery addresses)
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  area TEXT,
  building TEXT,
  floor TEXT,
  apartment TEXT,
  lat FLOAT8,
  lng FLOAT8,
  location GEOGRAPHY(POINT, 4326),
  phone TEXT,
  instructions TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_addresses_user ON addresses(user_id);
CREATE INDEX idx_addresses_default ON addresses(is_default);
CREATE INDEX idx_addresses_location ON addresses USING GIST(location);

-- User Locations Table (Saved favorite locations)
CREATE TABLE user_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat FLOAT8 NOT NULL,
  lng FLOAT8 NOT NULL,
  location GEOGRAPHY(POINT, 4326),
  type TEXT DEFAULT 'other',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_locations_user ON user_locations(user_id);
CREATE INDEX idx_user_locations_default ON user_locations(is_default);
CREATE INDEX idx_user_locations_location ON user_locations USING GIST(location);

-- Deals Table (Daily deals and promotions)
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  image_url TEXT,
  original_price DECIMAL(10,2) NOT NULL,
  deal_price DECIMAL(10,2) NOT NULL,
  discount_percentage INTEGER,
  quantity INTEGER DEFAULT 0,
  sold_count INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  terms TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT positive_prices CHECK (original_price >= deal_price AND deal_price > 0),
  CONSTRAINT valid_dates CHECK (end_date > start_date)
);

CREATE INDEX idx_deals_vendor ON deals(vendor_id);
CREATE INDEX idx_deals_product ON deals(product_id);
CREATE INDEX idx_deals_active ON deals(is_active);
CREATE INDEX idx_deals_dates ON deals(start_date, end_date);

-- Lucky Boxes Table (Mystery boxes/surprise deals)
CREATE TABLE lucky_boxes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT,
  description_ar TEXT,
  image_url TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_value DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 0,
  sold_count INTEGER DEFAULT 0,
  min_items INTEGER DEFAULT 1,
  max_items INTEGER DEFAULT 5,
  possible_items JSONB DEFAULT '[]',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  terms TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT positive_price CHECK (price > 0),
  CONSTRAINT valid_lucky_dates CHECK (end_date > start_date)
);

CREATE INDEX idx_lucky_boxes_vendor ON lucky_boxes(vendor_id);
CREATE INDEX idx_lucky_boxes_active ON lucky_boxes(is_active);
CREATE INDEX idx_lucky_boxes_dates ON lucky_boxes(start_date, end_date);

-- Order Items Table (Individual items in orders for better querying)
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES stores(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2),
  item_total DECIMAL(10,2),
  total DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER,
  product_name TEXT,
  product_name_ar TEXT,
  product_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_order_items_vendor ON order_items(vendor_id);

-- Disputes Table (Customer/Vendor disputes)
CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  vendor_id UUID REFERENCES stores(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  resolution TEXT,
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_disputes_order ON disputes(order_id);
CREATE INDEX idx_disputes_customer ON disputes(customer_id);
CREATE INDEX idx_disputes_vendor ON disputes(vendor_id);
CREATE INDEX idx_disputes_status ON disputes(status);

-- Support Tickets Table (Customer support tickets)
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'medium',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_assigned ON support_tickets(assigned_to);

-- Create vendors table for backwards compatibility
-- This is a real table that syncs with stores via triggers
-- PostgREST requires real tables for proper RLS and foreign key support
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  store_name TEXT,
  name TEXT,
  shop_name TEXT,
  shop_name_ar TEXT,
  name_ar TEXT,
  description TEXT,
  vendor_type TEXT,
  business_type business_type,
  category TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  latitude FLOAT8,
  lat FLOAT8,
  longitude FLOAT8,
  lng FLOAT8,
  location GEOGRAPHY(POINT, 4326),
  opening_hours JSONB DEFAULT '{}',
  is_online BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  approval_status approval_status DEFAULT 'pending',
  commission_rate DECIMAL(4,2) DEFAULT 10.00,
  documents TEXT[] DEFAULT '{}',
  wallet_balance DECIMAL(10,2) DEFAULT 0,
  bank_account JSONB,
  bank_name TEXT,
  account_number TEXT,
  iban TEXT,
  notifications_email BOOLEAN DEFAULT true,
  notifications_sms BOOLEAN DEFAULT true,
  notifications_orders BOOLEAN DEFAULT true,
  notifications_reviews BOOLEAN DEFAULT true,
  notifications_messages BOOLEAN DEFAULT true,
  theme_preference TEXT DEFAULT 'white',
  shop_logo TEXT,
  logo_url TEXT,
  banner_url TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_sales DECIMAL(10,2) DEFAULT 0,
  total_products INTEGER DEFAULT 0,
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vendors_user ON vendors(user_id);
CREATE INDEX idx_vendors_is_active ON vendors(is_active);
CREATE INDEX idx_vendors_location ON vendors USING GIST(location);
CREATE INDEX idx_vendors_business_type ON vendors(business_type);

-- Add foreign key constraints to products and chats for PostgREST relationship traversal
-- Since vendors.id is synced with stores.id, we can reference vendors directly
ALTER TABLE products 
  ADD CONSTRAINT products_vendor_id_vendors_fkey 
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;

ALTER TABLE chats 
  ADD CONSTRAINT chats_vendor_id_vendors_fkey 
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;

ALTER TABLE order_items
  ADD CONSTRAINT order_items_vendor_id_vendors_fkey
  FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE SET NULL;

-- Function to sync stores to vendors table
CREATE OR REPLACE FUNCTION sync_store_to_vendors()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    INSERT INTO vendors (
      id, user_id, store_name, name, shop_name, shop_name_ar, name_ar,
      description, vendor_type, business_type, category, phone, email,
      address, latitude, lat, longitude, lng, location, opening_hours,
      is_online, is_active, approval_status, commission_rate, documents,
      wallet_balance, bank_account, bank_name, account_number, iban,
      notifications_email, notifications_sms, notifications_orders,
      notifications_reviews, notifications_messages, theme_preference,
      shop_logo, logo_url, banner_url, rating, reviews_count, total_reviews,
      total_orders, total_sales, total_products, min_order_amount,
      is_featured, created_at, updated_at
    )
    VALUES (
      NEW.id, NEW.user_id, NEW.name, NEW.name, NEW.name, NEW.name_ar, NEW.name_ar,
      NEW.description, NEW.business_type::TEXT, NEW.business_type, NEW.category,
      NEW.phone, NEW.email, NEW.address, NEW.lat, NEW.lat, NEW.lng, NEW.lng,
      NEW.location, NEW.opening_hours, NEW.is_online, NEW.is_active,
      NEW.approval_status, NEW.commission_rate, NEW.documents, NEW.wallet_balance,
      NEW.bank_account, NEW.bank_name, NEW.account_number, NEW.iban,
      NEW.notifications_email, NEW.notifications_sms, NEW.notifications_orders,
      NEW.notifications_reviews, NEW.notifications_messages, NEW.theme_preference,
      NEW.logo_url, NEW.logo_url, NEW.banner_url, NEW.rating, NEW.total_reviews,
      NEW.total_reviews, NEW.total_orders, NEW.total_sales, NEW.total_products,
      NEW.min_order_amount, NEW.is_featured, NEW.created_at, NEW.updated_at
    )
    ON CONFLICT (id) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      store_name = EXCLUDED.store_name,
      name = EXCLUDED.name,
      shop_name = EXCLUDED.shop_name,
      shop_name_ar = EXCLUDED.shop_name_ar,
      name_ar = EXCLUDED.name_ar,
      description = EXCLUDED.description,
      vendor_type = EXCLUDED.vendor_type,
      business_type = EXCLUDED.business_type,
      category = EXCLUDED.category,
      phone = EXCLUDED.phone,
      email = EXCLUDED.email,
      address = EXCLUDED.address,
      latitude = EXCLUDED.latitude,
      lat = EXCLUDED.lat,
      longitude = EXCLUDED.longitude,
      lng = EXCLUDED.lng,
      location = EXCLUDED.location,
      opening_hours = EXCLUDED.opening_hours,
      is_online = EXCLUDED.is_online,
      is_active = EXCLUDED.is_active,
      approval_status = EXCLUDED.approval_status,
      commission_rate = EXCLUDED.commission_rate,
      documents = EXCLUDED.documents,
      wallet_balance = EXCLUDED.wallet_balance,
      bank_account = EXCLUDED.bank_account,
      bank_name = EXCLUDED.bank_name,
      account_number = EXCLUDED.account_number,
      iban = EXCLUDED.iban,
      notifications_email = EXCLUDED.notifications_email,
      notifications_sms = EXCLUDED.notifications_sms,
      notifications_orders = EXCLUDED.notifications_orders,
      notifications_reviews = EXCLUDED.notifications_reviews,
      notifications_messages = EXCLUDED.notifications_messages,
      theme_preference = EXCLUDED.theme_preference,
      shop_logo = EXCLUDED.shop_logo,
      logo_url = EXCLUDED.logo_url,
      banner_url = EXCLUDED.banner_url,
      rating = EXCLUDED.rating,
      reviews_count = EXCLUDED.reviews_count,
      total_reviews = EXCLUDED.total_reviews,
      total_orders = EXCLUDED.total_orders,
      total_sales = EXCLUDED.total_sales,
      total_products = EXCLUDED.total_products,
      min_order_amount = EXCLUDED.min_order_amount,
      is_featured = EXCLUDED.is_featured,
      updated_at = EXCLUDED.updated_at;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM vendors WHERE id = OLD.id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to sync stores changes to vendors
CREATE TRIGGER sync_stores_to_vendors
  AFTER INSERT OR UPDATE OR DELETE ON stores
  FOR EACH ROW EXECUTE FUNCTION sync_store_to_vendors();

-- ==========================================
-- FUNCTIONS & TRIGGERS
-- ==========================================

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, name, role, user_role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile automatically on auth signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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

CREATE TRIGGER update_order_items_updated_at BEFORE UPDATE ON order_items
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

CREATE TRIGGER sync_addresses_location BEFORE INSERT OR UPDATE ON addresses
  FOR EACH ROW WHEN (NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL)
  EXECUTE FUNCTION sync_location_geography();

CREATE TRIGGER sync_user_locations_location BEFORE INSERT OR UPDATE ON user_locations
  FOR EACH ROW EXECUTE FUNCTION sync_location_geography();

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

-- Function: Get admin dashboard statistics
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS TABLE (
  total_users BIGINT,
  total_vendors BIGINT,
  total_orders BIGINT,
  total_revenue NUMERIC,
  pending_vendors BIGINT,
  pending_orders BIGINT,
  active_drivers BIGINT,
  open_disputes BIGINT,
  open_tickets BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM users WHERE role = 'customer')::BIGINT,
    (SELECT COUNT(*) FROM stores)::BIGINT,
    (SELECT COUNT(*) FROM orders)::BIGINT,
    (SELECT COALESCE(SUM(total), 0) FROM orders WHERE payment_status = 'paid')::NUMERIC,
    (SELECT COUNT(*) FROM stores WHERE approval_status = 'pending')::BIGINT,
    (SELECT COUNT(*) FROM orders WHERE status = 'pending')::BIGINT,
    (SELECT COUNT(*) FROM drivers WHERE is_available = true AND is_active = true)::BIGINT,
    (SELECT COUNT(*) FROM disputes WHERE status = 'open')::BIGINT,
    (SELECT COUNT(*) FROM support_tickets WHERE status = 'open')::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE lucky_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Stores policies
CREATE POLICY "Anyone can view active stores" ON stores FOR SELECT USING (is_active = true);
CREATE POLICY "Vendors can manage own store" ON stores FOR ALL USING (auth.uid() = user_id);

-- Vendors policies (same as stores for backwards compatibility)
CREATE POLICY "Anyone can view active vendors" ON vendors FOR SELECT USING (is_active = true);
CREATE POLICY "Vendors can manage own vendor profile" ON vendors FOR ALL USING (auth.uid() = user_id);

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

-- Addresses policies
CREATE POLICY "Users can view own addresses" ON addresses FOR SELECT 
  USING (user_id = auth.uid());
CREATE POLICY "Users can manage own addresses" ON addresses FOR ALL 
  USING (user_id = auth.uid());

-- User locations policies
CREATE POLICY "Users can view own locations" ON user_locations FOR SELECT 
  USING (user_id = auth.uid());
CREATE POLICY "Users can manage own locations" ON user_locations FOR ALL 
  USING (user_id = auth.uid());

-- Deals policies
CREATE POLICY "Anyone can view active deals" ON deals FOR SELECT 
  USING (is_active = true AND end_date >= NOW());
CREATE POLICY "Vendors can manage own deals" ON deals FOR ALL 
  USING (vendor_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

-- Lucky boxes policies
CREATE POLICY "Anyone can view active lucky boxes" ON lucky_boxes FOR SELECT 
  USING (is_active = true AND end_date >= NOW() AND start_date <= NOW());
CREATE POLICY "Vendors can manage own lucky boxes" ON lucky_boxes FOR ALL 
  USING (vendor_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));

-- Order items policies
CREATE POLICY "Customers can view own order items" ON order_items FOR SELECT 
  USING (order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid()));
CREATE POLICY "Vendors can view store order items" ON order_items FOR SELECT 
  USING (vendor_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Admins can view all order items" ON order_items FOR SELECT 
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

-- Disputes policies
CREATE POLICY "Customers can view own disputes" ON disputes FOR SELECT 
  USING (customer_id = auth.uid());
CREATE POLICY "Vendors can view store disputes" ON disputes FOR SELECT 
  USING (vendor_id IN (SELECT id FROM stores WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage all disputes" ON disputes FOR ALL 
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Customers can create disputes" ON disputes FOR INSERT 
  WITH CHECK (customer_id = auth.uid());

-- Support tickets policies
CREATE POLICY "Users can view own tickets" ON support_tickets FOR SELECT 
  USING (user_id = auth.uid());
CREATE POLICY "Admins can view all tickets" ON support_tickets FOR SELECT 
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Users can create tickets" ON support_tickets FOR INSERT 
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can update tickets" ON support_tickets FOR UPDATE 
  USING ((SELECT role FROM users WHERE id = auth.uid()) = 'admin');

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

-- Sync existing auth users to users table (for migrations)
INSERT INTO users (id, email, full_name, name, role, user_role)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  COALESCE((au.raw_user_meta_data->>'role')::user_role, 'customer'),
  COALESCE(au.raw_user_meta_data->>'role', 'customer')
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = au.id);

-- Sync existing stores to vendors table
INSERT INTO vendors (
  id, user_id, store_name, name, shop_name, shop_name_ar, name_ar,
  description, vendor_type, business_type, category, phone, email,
  address, latitude, lat, longitude, lng, location, opening_hours,
  is_online, is_active, approval_status, commission_rate, documents,
  wallet_balance, bank_account, bank_name, account_number, iban,
  notifications_email, notifications_sms, notifications_orders,
  notifications_reviews, notifications_messages, theme_preference,
  shop_logo, logo_url, banner_url, rating, reviews_count, total_reviews,
  total_orders, total_sales, total_products, min_order_amount,
  is_featured, created_at, updated_at
)
SELECT 
  s.id, s.user_id, s.name, s.name, s.name, s.name_ar, s.name_ar,
  s.description, s.business_type::TEXT, s.business_type, s.category,
  s.phone, s.email, s.address, s.lat, s.lat, s.lng, s.lng,
  s.location, s.opening_hours, s.is_online, s.is_active,
  s.approval_status, s.commission_rate, s.documents, s.wallet_balance,
  s.bank_account, s.bank_name, s.account_number, s.iban,
  s.notifications_email, s.notifications_sms, s.notifications_orders,
  s.notifications_reviews, s.notifications_messages, s.theme_preference,
  s.logo_url, s.logo_url, s.banner_url, s.rating, s.total_reviews,
  s.total_reviews, s.total_orders, s.total_sales, s.total_products,
  s.min_order_amount, s.is_featured, s.created_at, s.updated_at
FROM stores s
WHERE NOT EXISTS (SELECT 1 FROM vendors v WHERE v.id = s.id);

-- ===============================================
-- ADDITIONAL ADMIN DASHBOARD TABLES
-- ===============================================

-- PAGES TABLE (CMS for static pages)
CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    title_ar TEXT,
    content TEXT NOT NULL,
    content_ar TEXT,
    meta_description TEXT,
    meta_description_ar TEXT,
    is_published BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_is_published ON pages(is_published);

ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view published pages" ON pages FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can do everything with pages" ON pages FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON pages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- HERO SECTIONS TABLE (Homepage hero/banner management)
CREATE TABLE IF NOT EXISTS hero_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    title_ar TEXT,
    subtitle TEXT,
    subtitle_ar TEXT,
    image_url TEXT,
    mobile_image_url TEXT,
    button_text TEXT,
    button_text_ar TEXT,
    button_link TEXT,
    background_color TEXT DEFAULT '#FF6B35',
    text_color TEXT DEFAULT '#FFFFFF',
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hero_sections_is_active ON hero_sections(is_active);
CREATE INDEX idx_hero_sections_display_order ON hero_sections(display_order);

ALTER TABLE hero_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active hero sections" ON hero_sections FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage hero sections" ON hero_sections FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE TRIGGER update_hero_sections_updated_at BEFORE UPDATE ON hero_sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- LOYALTY SETTINGS TABLE
CREATE TABLE IF NOT EXISTS loyalty_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    points_per_currency DECIMAL(10, 2) NOT NULL DEFAULT 1.00,
    referral_bonus INTEGER NOT NULL DEFAULT 100,
    min_redemption_points INTEGER NOT NULL DEFAULT 100,
    point_expiry_days INTEGER DEFAULT 365,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE loyalty_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view loyalty settings" ON loyalty_settings FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage loyalty settings" ON loyalty_settings FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE TRIGGER update_loyalty_settings_updated_at BEFORE UPDATE ON loyalty_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default loyalty settings
INSERT INTO loyalty_settings (points_per_currency, referral_bonus, min_redemption_points)
VALUES (1.00, 100, 100)
ON CONFLICT DO NOTHING;

-- LOYALTY TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted', 'referral_bonus')),
    type TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired', 'adjusted', 'referral_bonus')),
    reference_type TEXT CHECK (reference_type IN ('order', 'referral', 'admin_adjustment', 'signup_bonus')),
    reference_id UUID,
    description TEXT,
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX idx_loyalty_transactions_type ON loyalty_transactions(transaction_type);
CREATE INDEX idx_loyalty_transactions_created_at ON loyalty_transactions(created_at);

ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can do everything with loyalty_transactions" ON loyalty_transactions FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "Users can view their own loyalty transactions" ON loyalty_transactions FOR SELECT TO authenticated USING (
    user_id = auth.uid()
);

-- Trigger to sync type and transaction_type
CREATE OR REPLACE FUNCTION sync_loyalty_transaction_type()
RETURNS TRIGGER AS $$
BEGIN
  NEW.type = NEW.transaction_type;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_loyalty_type BEFORE INSERT OR UPDATE ON loyalty_transactions
  FOR EACH ROW EXECUTE FUNCTION sync_loyalty_transaction_type();

-- REFERRALS TABLE
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
    reward_points INTEGER NOT NULL DEFAULT 100,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_referral UNIQUE (referrer_id, referred_id)
);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX idx_referrals_status ON referrals(status);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can do everything with referrals" ON referrals FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "Users can view their own referrals" ON referrals FOR SELECT TO authenticated USING (
    referrer_id = auth.uid() OR referred_id = auth.uid()
);

-- PAYOUTS TABLE
CREATE TABLE IF NOT EXISTS payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id),
    amount DECIMAL(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'paypal', 'stripe', 'cash')),
    bank_name TEXT,
    account_number TEXT,
    bank_account_number TEXT,
    account_holder TEXT,
    bank_account_holder TEXT,
    transaction_id TEXT,
    notes TEXT,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payouts_user_id ON payouts(user_id);
CREATE INDEX idx_payouts_store_id ON payouts(store_id);
CREATE INDEX idx_payouts_status ON payouts(status);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can do everything with payouts" ON payouts FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE POLICY "Vendors can view their own payouts" ON payouts FOR SELECT TO authenticated USING (
    user_id = auth.uid()
);
CREATE POLICY "Vendors can create payout requests" ON payouts FOR INSERT TO authenticated WITH CHECK (
    user_id = auth.uid()
);
CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON payouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to sync payout account fields
CREATE OR REPLACE FUNCTION sync_payout_fields()
RETURNS TRIGGER AS $$
BEGIN
  NEW.bank_account_number = NEW.account_number;
  NEW.bank_account_holder = NEW.account_holder;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_payout_aliases BEFORE INSERT OR UPDATE ON payouts
  FOR EACH ROW EXECUTE FUNCTION sync_payout_fields();

-- SHIPPING SETTINGS TABLE
CREATE TABLE IF NOT EXISTS shipping_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_rate DECIMAL(10, 2) NOT NULL DEFAULT 5.00,
    per_km_rate DECIMAL(10, 2) NOT NULL DEFAULT 0.50,
    free_shipping_threshold DECIMAL(10, 2) DEFAULT 100.00,
    max_distance_km INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE shipping_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view shipping settings" ON shipping_settings FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage shipping settings" ON shipping_settings FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
);
CREATE TRIGGER update_shipping_settings_updated_at BEFORE UPDATE ON shipping_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default shipping settings
INSERT INTO shipping_settings (base_rate, per_km_rate, free_shipping_threshold, max_distance_km)
VALUES (5.00, 0.50, 100.00, 50)
ON CONFLICT DO NOTHING;

-- ===============================================
-- ADD MISSING COLUMNS
-- ===============================================

-- Add columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_earned_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code) WHERE referral_code IS NOT NULL;

-- Add total_amount to orders table (if not exists)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2);
UPDATE orders SET total_amount = total WHERE total_amount IS NULL AND total IS NOT NULL;

-- ===============================================
-- ADDITIONAL FUNCTIONS
-- ===============================================

-- Generate Referral Code Function
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        code := upper(substring(md5(random()::text) from 1 for 8));
        SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = code) INTO code_exists;
        EXIT WHEN NOT code_exists;
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Update existing users with referral codes
UPDATE users 
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;

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
  RAISE NOTICE '📊 Tables created: users, stores, vendors, products, orders, drivers, reviews, notifications, chats, messages, cart_items, wishlists, store_followers, exchange_rates, addresses, user_locations, deals, lucky_boxes, order_items, disputes, support_tickets, pages, hero_sections, loyalty_settings, loyalty_transactions, referrals, payouts, shipping_settings';
  RAISE NOTICE '🗂️  Vendors table: Real table synced with stores via triggers (not a VIEW)';
  RAISE NOTICE '🔄 Auto-sync: stores ↔ vendors (INSERT/UPDATE/DELETE triggers)';
  RAISE NOTICE '🔒 RLS policies applied on all tables';
  RAISE NOTICE '🌱 Initial categories seeded';
  RAISE NOTICE '⚡ Functions created: get_current_user, get_latest_exchange_rates, update_exchange_rates, get_unread_count, get_admin_dashboard_stats, handle_new_user, generate_referral_code';
  RAISE NOTICE '🔄 Alias columns auto-synced via triggers';
  RAISE NOTICE '👤 Auth trigger: Automatically creates user profile on signup';
  RAISE NOTICE '♻️  Existing auth users synced to users table';
  RAISE NOTICE '🎁 Loyalty system: points, transactions, referrals, settings tables added';
  RAISE NOTICE '💰 Payouts table added for vendor/driver payments';
  RAISE NOTICE '🚚 Shipping settings table added';
  RAISE NOTICE '📄 Pages table added for CMS';
  RAISE NOTICE '🎫 Support tickets and disputes tables added';
  RAISE NOTICE '⚠️  IMPORTANT: Reload Schema Cache in Supabase Dashboard after running this script';
  RAISE NOTICE '📌 To reload schema: Go to Settings → API → Click "Reload schema cache" button';
END $$;
