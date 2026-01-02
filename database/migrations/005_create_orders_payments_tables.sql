-- =========================================================
-- المرحلة 5: جداول الطلبات والمدفوعات
-- =========================================================
-- الإصدار: 2.0
-- التاريخ: 2026-01-02
-- الوصف: نظام الطلبات الكامل مع المدفوعات والتوصيل
-- =========================================================

-- =====================================================
-- 1. جدول الطلبات الرئيسي
-- =====================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- العلاقات
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE RESTRICT,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- الحالة
  status order_status NOT NULL DEFAULT 'pending',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  delivery_status delivery_status NOT NULL DEFAULT 'pending',
  
  -- المبالغ
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  
  -- معلومات الدفع
  payment_method payment_method NOT NULL DEFAULT 'cash',
  paid_amount DECIMAL(10, 2) DEFAULT 0.00,
  
  -- معلومات التوصيل
  delivery_address TEXT NOT NULL,
  delivery_city VARCHAR(100) NOT NULL,
  delivery_latitude DECIMAL(10, 8),
  delivery_longitude DECIMAL(11, 8),
  delivery_phone VARCHAR(20) NOT NULL,
  delivery_notes TEXT,
  
  -- الأوقات
  preparation_time INTEGER, -- بالدقائق
  estimated_delivery_time TIMESTAMP WITH TIME ZONE,
  
  -- ملاحظات
  customer_notes TEXT,
  vendor_notes TEXT,
  admin_notes TEXT,
  cancellation_reason TEXT,
  
  -- التوقيتات
  confirmed_at TIMESTAMP WITH TIME ZONE,
  preparing_at TIMESTAMP WITH TIME ZONE,
  ready_at TIMESTAMP WITH TIME ZONE,
  out_for_delivery_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- قيود
  CONSTRAINT valid_amounts CHECK (
    subtotal >= 0 AND
    tax_amount >= 0 AND
    delivery_fee >= 0 AND
    discount_amount >= 0 AND
    total_amount >= 0 AND
    paid_amount >= 0
  )
);

-- الفهارس
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_vendor_id ON public.orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON public.orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON public.orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);

COMMENT ON TABLE public.orders IS 'جدول الطلبات الرئيسي';

-- =====================================================
-- 2. جدول عناصر الطلب (Order Items)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  
  -- المنتج
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  
  -- معلومات المنتج وقت الطلب
  product_name VARCHAR(255) NOT NULL,
  variant_name VARCHAR(255),
  product_image_url TEXT,
  sku VARCHAR(100),
  
  -- الكمية والسعر
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0.00,
  total DECIMAL(10, 2) NOT NULL,
  
  -- ملاحظات خاصة
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- قيود
  CONSTRAINT valid_quantity CHECK (quantity > 0),
  CONSTRAINT valid_item_price CHECK (unit_price > 0),
  CONSTRAINT valid_item_total CHECK (total > 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON public.order_items(variant_id);

COMMENT ON TABLE public.order_items IS 'عناصر/منتجات الطلب';

-- =====================================================
-- 3. جدول المدفوعات
-- =====================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  
  -- المبلغ
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'SAR',
  
  -- معلومات الدفع
  payment_method payment_method NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  
  -- معلومات البوابة
  gateway VARCHAR(50), -- 'stripe', 'paypal', 'tap', etc.
  transaction_id VARCHAR(255),
  gateway_response JSONB,
  
  -- الفشل والاسترجاع
  failure_reason TEXT,
  refund_amount DECIMAL(10, 2) DEFAULT 0.00,
  refund_reason TEXT,
  refunded_at TIMESTAMP WITH TIME ZONE,
  
  -- التوقيتات
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_payment_amount CHECK (amount > 0)
);

CREATE INDEX IF NOT EXISTS idx_payments_order_id ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON public.payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(payment_status);

COMMENT ON TABLE public.payments IS 'سجل المدفوعات';

-- =====================================================
-- 4. جدول سجل حالة الطلب
-- =====================================================

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  
  -- الحالة
  old_status order_status,
  new_status order_status NOT NULL,
  
  -- المستخدم الذي قام بالتغيير
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- ملاحظات
  notes TEXT,
  
  -- الموقع (للسائق)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created ON public.order_status_history(created_at);

COMMENT ON TABLE public.order_status_history IS 'سجل تغييرات حالة الطلب';

-- =====================================================
-- 5. جدول التوصيل (Deliveries)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  
  -- الحالة
  status delivery_status NOT NULL DEFAULT 'pending',
  
  -- معلومات الالتقاط
  pickup_address TEXT NOT NULL,
  pickup_latitude DECIMAL(10, 8),
  pickup_longitude DECIMAL(11, 8),
  
  -- معلومات التسليم
  delivery_address TEXT NOT NULL,
  delivery_latitude DECIMAL(10, 8),
  delivery_longitude DECIMAL(11, 8),
  
  -- المسافة والوقت
  distance_km DECIMAL(10, 2),
  estimated_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  
  -- الرسوم
  delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  driver_commission DECIMAL(10, 2) DEFAULT 0.00,
  
  -- ملاحظات
  pickup_notes TEXT,
  delivery_notes TEXT,
  failure_reason TEXT,
  
  -- صورة التسليم (إثبات)
  delivery_proof_image_url TEXT,
  delivery_signature TEXT,
  
  -- التوقيتات
  assigned_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  picked_up_at TIMESTAMP WITH TIME ZONE,
  arrived_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON public.deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver_id ON public.deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);

COMMENT ON TABLE public.deliveries IS 'معلومات التوصيل التفصيلية';

-- =====================================================
-- 6. تفعيل Row Level Security
-- =====================================================

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. Triggers
-- =====================================================

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_deliveries_updated_at
  BEFORE UPDATE ON public.deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 8. Functions
-- =====================================================

-- Function لإنشاء رقم طلب تلقائي
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
  year_suffix VARCHAR(2);
  random_part VARCHAR(8);
  new_number VARCHAR(50);
BEGIN
  IF NEW.order_number IS NOT NULL AND NEW.order_number != '' THEN
    RETURN NEW;
  END IF;
  
  year_suffix := TO_CHAR(NOW(), 'YY');
  random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  new_number := 'ORD-' || year_suffix || '-' || random_part;
  
  -- التأكد من التفرد
  WHILE EXISTS (SELECT 1 FROM public.orders WHERE order_number = new_number) LOOP
    random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    new_number := 'ORD-' || year_suffix || '-' || random_part;
  END LOOP;
  
  NEW.order_number := new_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_order_number_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_order_number();

-- Function لتسجيل تغيير حالة الطلب
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status THEN
    INSERT INTO public.order_status_history (
      order_id,
      old_status,
      new_status,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_order_status_change_trigger
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.log_order_status_change();

-- =========================================================
-- نهاية ملف جداول الطلبات والمدفوعات
-- =========================================================
