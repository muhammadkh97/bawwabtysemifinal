-- =========================================================
-- 09-restaurant-system.sql
-- نظام المطاعم المتكامل
-- =========================================================

-- =====================================================
-- 1. جدول المطاعم
-- =====================================================

CREATE TABLE public.restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL UNIQUE,
  restaurant_name VARCHAR(255) NOT NULL,
  description TEXT,
  cuisine_type VARCHAR(100), -- 'italian', 'arabic', 'chinese', etc
  logo_url TEXT,
  banner_url TEXT,
  phone VARCHAR(20),
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  opening_time TIME,
  closing_time TIME,
  is_open BOOLEAN DEFAULT TRUE,
  delivery_available BOOLEAN DEFAULT TRUE,
  delivery_fee DECIMAL(10, 2),
  min_order_amount DECIMAL(10, 2),
  
  average_rating DECIMAL(3, 2) DEFAULT 0,
  total_orders INT DEFAULT 0,
  
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_restaurants_owner_id ON public.restaurants(owner_id);
CREATE INDEX idx_restaurants_city ON public.restaurants(city);
CREATE INDEX idx_restaurants_is_active ON public.restaurants(is_active);
CREATE INDEX idx_restaurants_cuisine ON public.restaurants(cuisine_type);

-- =====================================================
-- 2. جدول فئات القائمة
-- =====================================================

CREATE TABLE public.menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  description TEXT,
  icon_url TEXT,
  
  order_index INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE
);

CREATE INDEX idx_menu_categories_restaurant_id ON public.menu_categories(restaurant_id);

-- =====================================================
-- 3. جدول عناصر القائمة (الوجبات)
-- =====================================================

CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL,
  category_id UUID NOT NULL,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  discount_percentage INT DEFAULT 0,
  
  preparation_time INT, -- في الدقائق
  is_available BOOLEAN DEFAULT TRUE,
  
  rating DECIMAL(3, 2) DEFAULT 0,
  order_count INT DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES public.menu_categories(id) ON DELETE RESTRICT
);

CREATE INDEX idx_menu_items_restaurant_id ON public.menu_items(restaurant_id);
CREATE INDEX idx_menu_items_category_id ON public.menu_items(category_id);
CREATE INDEX idx_menu_items_is_available ON public.menu_items(is_available);

-- =====================================================
-- 4. جدول حالات تحضير الطعام
-- =====================================================

CREATE TABLE public.order_preparations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  restaurant_id UUID NOT NULL,
  
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'preparing', 'ready', 'completed'
  estimated_time INT, -- في الدقائق
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE CASCADE
);

CREATE INDEX idx_order_preparations_order_id ON public.order_preparations(order_id);
CREATE INDEX idx_order_preparations_restaurant_id ON public.order_preparations(restaurant_id);
CREATE INDEX idx_order_preparations_status ON public.order_preparations(status);

-- =====================================================
-- 5. المشغلات
-- =====================================================

CREATE TRIGGER update_restaurants_timestamp BEFORE UPDATE ON public.restaurants
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_menu_categories_timestamp BEFORE UPDATE ON public.menu_categories
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_menu_items_timestamp BEFORE UPDATE ON public.menu_items
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_order_preparations_timestamp BEFORE UPDATE ON public.order_preparations
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

SELECT 'تم إنشاء نظام المطاعم بنجاح ✓' AS status;
