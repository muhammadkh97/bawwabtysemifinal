-- =========================================================
-- 02-core-schema.sql
-- البنية الأساسية - جداول المستخدمين والمنتجات
-- =========================================================

-- =====================================================
-- 1. ENUMS (أنواع البيانات المخصصة)
-- =====================================================

CREATE TYPE user_role AS ENUM (
  'admin',
  'vendor',
  'restaurant',
  'driver',
  'customer'
);

CREATE TYPE vendor_type AS ENUM (
  'restaurant',
  'shop',
  'supermarket',
  'pharmacy',
  'grocery'
);

CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'in_delivery',
  'delivered',
  'cancelled'
);

CREATE TYPE delivery_status AS ENUM (
  'pending',
  'accepted',
  'in_transit',
  'delivered',
  'failed'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'completed',
  'failed',
  'refunded'
);

-- =====================================================
-- 2. جدول المستخدمين الرئيسي
-- =====================================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  full_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  user_role user_role NOT NULL DEFAULT 'customer',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(user_role);

-- =====================================================
-- 3. جدول البائعين
-- =====================================================

CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL UNIQUE,
  vendor_name VARCHAR(255) NOT NULL,
  vendor_type vendor_type NOT NULL,
  description TEXT,
  logo_url TEXT,
  store_address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_vendors_owner_id ON public.vendors(owner_id);
CREATE INDEX idx_vendors_city ON public.vendors(city);
CREATE INDEX idx_vendors_is_active ON public.vendors(is_active);

-- =====================================================
-- 4. جدول السائقين
-- =====================================================

CREATE TABLE public.drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  vehicle_type VARCHAR(50),
  vehicle_number VARCHAR(50),
  is_active BOOLEAN DEFAULT FALSE,
  is_online BOOLEAN DEFAULT FALSE,
  current_city VARCHAR(100),
  total_deliveries INT DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_drivers_user_id ON public.drivers(user_id);
CREATE INDEX idx_drivers_is_active ON public.drivers(is_active);
CREATE INDEX idx_drivers_is_online ON public.drivers(is_online);

-- =====================================================
-- 5. جدول الفئات
-- =====================================================

CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  name_ar VARCHAR(255),
  description TEXT,
  icon_name VARCHAR(50),
  order_index INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_categories_is_active ON public.categories(is_active);

-- =====================================================
-- 6. جدول المنتجات
-- =====================================================

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  category_id UUID NOT NULL,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock_quantity INT DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  review_count INT DEFAULT 0,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE RESTRICT
);

CREATE INDEX idx_products_vendor_id ON public.products(vendor_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_is_active ON public.products(is_active);

-- =====================================================
-- 7. جدول التقييمات
-- =====================================================

CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  order_id UUID,
  
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE
  -- ملاحظة: سيتم إضافة هذا القيد بعد إنشاء جدول orders في 03-orders-delivery.sql
  -- , FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL
);

CREATE INDEX idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX idx_reviews_customer_id ON public.reviews(customer_id);

-- =====================================================
-- 8. جدول الإعدادات
-- =====================================================

CREATE TABLE public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT,
  setting_type VARCHAR(50),
  description TEXT,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_settings_key ON public.settings(key);

-- =====================================================
-- 9. جدول الصفحات الثابتة
-- =====================================================

CREATE TABLE public.static_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  title_ar VARCHAR(255),
  content TEXT,
  content_ar TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_static_pages_slug ON public.static_pages(slug);

-- =====================================================
-- 10. دالة التحديث التلقائي
-- =====================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. تطبيق المحفزات
-- =====================================================

CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_vendors_timestamp BEFORE UPDATE ON public.vendors
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_drivers_timestamp BEFORE UPDATE ON public.drivers
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_products_timestamp BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_categories_timestamp BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_settings_timestamp BEFORE UPDATE ON public.settings
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_static_pages_timestamp BEFORE UPDATE ON public.static_pages
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

SELECT 'تم إنشاء البنية الأساسية بنجاح ✓' AS status;
