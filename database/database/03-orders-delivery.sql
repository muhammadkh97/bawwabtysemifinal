-- =========================================================
-- 03-orders-delivery.sql
-- نظام الطلبات والتوصيل
-- =========================================================

-- =====================================================
-- 1. جدول الطلبات
-- =====================================================

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  restaurant_id UUID,
  customer_id UUID NOT NULL,
  driver_id UUID,
  
  order_number VARCHAR(50) UNIQUE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status order_status DEFAULT 'pending',
  payment_status payment_status DEFAULT 'pending',
  
  delivery_address TEXT NOT NULL,
  delivery_city VARCHAR(100),
  special_requests TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE,
  -- ملاحظة: سيتم إضافة هذا القيد بعد إنشاء جدول restaurants (09-restaurant-system.sql)
  -- FOREIGN KEY (restaurant_id) REFERENCES public.restaurants(id) ON DELETE SET NULL,
  FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE SET NULL
);

CREATE INDEX idx_orders_vendor_id ON public.orders(vendor_id);
CREATE INDEX idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX idx_orders_driver_id ON public.orders(driver_id);
CREATE INDEX idx_orders_status ON public.orders(status);

-- =====================================================
-- 2. جدول عناصر الطلب
-- =====================================================

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  product_id UUID NOT NULL,
  
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  item_total DECIMAL(10, 2) NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT
);

CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);

-- =====================================================
-- 3. جدول التوصيل
-- =====================================================

CREATE TABLE public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE,
  driver_id UUID NOT NULL,
  
  status delivery_status DEFAULT 'pending',
  estimated_distance_km DECIMAL(10, 2),
  estimated_duration_minutes INT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES public.drivers(id) ON DELETE RESTRICT
);

CREATE INDEX idx_deliveries_driver_id ON public.deliveries(driver_id);
CREATE INDEX idx_deliveries_status ON public.deliveries(status);

-- =====================================================
-- 4. جدول العربة
-- =====================================================

CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  vendor_id UUID NOT NULL,
  product_id UUID NOT NULL,
  
  quantity INT NOT NULL CHECK (quantity > 0),
  
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE,
  FOREIGN KEY (vendor_id) REFERENCES public.vendors(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  
  UNIQUE(customer_id, product_id, vendor_id)
);

CREATE INDEX idx_cart_items_customer_id ON public.cart_items(customer_id);

-- =====================================================
-- 5. قائمة الرغبات
-- =====================================================

CREATE TABLE public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  product_id UUID NOT NULL,
  
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE,
  
  UNIQUE(customer_id, product_id)
);

CREATE INDEX idx_wishlists_customer_id ON public.wishlists(customer_id);

-- =====================================================
-- 6. Triggers
-- =====================================================

CREATE TRIGGER update_orders_timestamp BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_deliveries_timestamp BEFORE UPDATE ON public.deliveries
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

SELECT 'تم إنشاء نظام الطلبات والتوصيل بنجاح ✓' AS status;
