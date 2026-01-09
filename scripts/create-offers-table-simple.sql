-- =================================================================
-- إنشاء جدول العروض (Offers) - نسخة مبسطة
-- تاريخ: 2026-01-09
-- =================================================================

-- إنشاء جدول العروض
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_ar TEXT,
  description TEXT NOT NULL,
  description_ar TEXT,
  discount_percentage INTEGER CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  discount_amount DECIMAL(10,2),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  mobile_image_url TEXT,
  link TEXT,
  terms_conditions TEXT,
  terms_conditions_ar TEXT,
  max_usage_per_user INTEGER,
  total_usage_limit INTEGER,
  current_usage INTEGER DEFAULT 0,
  offer_type TEXT CHECK (offer_type IN ('percentage', 'fixed_amount', 'free_shipping', 'buy_x_get_y', 'bundle')),
  applicable_to TEXT CHECK (applicable_to IN ('all', 'category', 'product', 'vendor')),
  applicable_ids TEXT[],
  min_purchase_amount DECIMAL(10,2),
  priority INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- إنشاء الفهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_offers_active_dates ON offers(is_active, start_date, end_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_offers_end_date ON offers(end_date);
CREATE INDEX IF NOT EXISTS idx_offers_type ON offers(offer_type);
CREATE INDEX IF NOT EXISTS idx_offers_applicable_to ON offers(applicable_to);
CREATE INDEX IF NOT EXISTS idx_offers_priority ON offers(priority DESC, display_order);
CREATE INDEX IF NOT EXISTS idx_offers_created_at ON offers(created_at DESC);

-- تفعيل Row Level Security
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة للعروض النشطة (للجميع)
DROP POLICY IF EXISTS "Allow public read active offers" ON offers;
CREATE POLICY "Allow public read active offers" ON offers 
  FOR SELECT 
  USING (
    is_active = true 
    AND start_date <= NOW() 
    AND end_date >= NOW()
  );

-- دالة لتحديث updated_at تلقائياً
CREATE OR REPLACE FUNCTION update_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger لتحديث updated_at
DROP TRIGGER IF EXISTS trigger_update_offers_updated_at ON offers;
CREATE TRIGGER trigger_update_offers_updated_at
  BEFORE UPDATE ON offers
  FOR EACH ROW
  EXECUTE FUNCTION update_offers_updated_at();

-- دالة لتعطيل العروض المنتهية تلقائياً
CREATE OR REPLACE FUNCTION deactivate_expired_offers()
RETURNS void AS $$
BEGIN
  UPDATE offers
  SET is_active = false
  WHERE is_active = true
  AND end_date < NOW();
END;
$$ LANGUAGE plpgsql;

-- إدراج بيانات تجريبية
INSERT INTO offers (
  title, 
  title_ar, 
  description, 
  description_ar, 
  discount_percentage, 
  start_date, 
  end_date, 
  is_active, 
  image_url,
  link,
  offer_type,
  applicable_to,
  priority,
  display_order
) VALUES
  (
    'Super Sale - 50% Off Electronics',
    'تخفيضات كبرى - خصم 50% على الإلكترونيات',
    'Get amazing discounts on all electronic products for a limited time only!',
    'احصل على خصومات مذهلة على جميع المنتجات الإلكترونية لفترة محدودة فقط!',
    50,
    NOW(),
    NOW() + INTERVAL '7 days',
    true,
    'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800',
    '/products?category=electronics',
    'percentage',
    'category',
    10,
    1
  ),
  (
    '30% Off Fashion Collection',
    'خصم 30% على مجموعة الأزياء',
    'Huge discounts on the latest fashion trends and styles',
    'تخفيضات كبيرة على أحدث صيحات الموضة والأزياء',
    30,
    NOW(),
    NOW() + INTERVAL '14 days',
    true,
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800',
    '/products?category=fashion',
    'percentage',
    'category',
    8,
    2
  ),
  (
    'Home & Kitchen Sale',
    'عروض على المنزل والمطبخ',
    'Save up to 40% on home and kitchen products',
    'وفر حتى 40% على منتجات المنزل والمطبخ',
    40,
    NOW(),
    NOW() + INTERVAL '10 days',
    true,
    'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800',
    '/products?category=home',
    'percentage',
    'category',
    7,
    3
  ),
  (
    'Flash Sale - Today Only!',
    'تخفيضات سريعة - اليوم فقط!',
    'Limited time flash sale with incredible deals',
    'عروض سريعة لفترة محدودة مع صفقات لا تصدق',
    60,
    NOW(),
    NOW() + INTERVAL '1 day',
    true,
    'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800',
    '/deals',
    'percentage',
    'all',
    15,
    0
  ),
  (
    'Free Shipping Weekend',
    'شحن مجاني نهاية الأسبوع',
    'Free shipping on all orders this weekend',
    'شحن مجاني على جميع الطلبات في نهاية الأسبوع',
    0,
    NOW(),
    NOW() + INTERVAL '3 days',
    true,
    'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800',
    '/products',
    'free_shipping',
    'all',
    5,
    4
  )
ON CONFLICT (id) DO NOTHING;

-- تعليقات على الجدول
COMMENT ON TABLE offers IS 'جدول العروض والخصومات';

-- عرض النتائج
SELECT 
    '=== تم إنشاء جدول offers بنجاح ===' as message;

SELECT 
    COUNT(*) as "عدد العروض المضافة",
    COUNT(CASE WHEN is_active = true THEN 1 END) as "العروض النشطة"
FROM offers;

SELECT 
    title_ar as "العنوان",
    discount_percentage as "نسبة الخصم %",
    link as "الرابط",
    is_active as "نشط"
FROM offers
ORDER BY priority DESC, display_order;

-- =================================================================
-- انتهى السكريبت
-- =================================================================
