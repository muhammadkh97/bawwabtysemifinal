-- ✅ إنشاء جدول الكوبونات
-- التاريخ: 4 يناير 2026
-- الوصف: جدول لتخزين الكوبونات والعروضات للبائعين

-- 1️⃣ إنشاء نوع ENUM لنوع الخصم
CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');

-- 2️⃣ إنشاء جدول الكوبونات
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type discount_type NOT NULL DEFAULT 'percentage',
  discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
  min_purchase DECIMAL(10,2) DEFAULT 0,
  max_discount DECIMAL(10,2),
  usage_limit INTEGER DEFAULT 0,
  used_count INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT non_negative_min_purchase CHECK (min_purchase >= 0)
);

-- 3️⃣ إنشاء الفهارس للأداء
CREATE INDEX IF NOT EXISTS idx_coupons_vendor_id ON coupons(vendor_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_start_date ON coupons(start_date);
CREATE INDEX IF NOT EXISTS idx_coupons_end_date ON coupons(end_date);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);

-- 4️⃣ تفعيل RLS على جدول الكوبونات
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة إن وجدت
DROP POLICY IF EXISTS "coupons_select_public" ON coupons;
DROP POLICY IF EXISTS "coupons_select_vendor" ON coupons;
DROP POLICY IF EXISTS "coupons_insert_vendor" ON coupons;
DROP POLICY IF EXISTS "coupons_update_vendor" ON coupons;
DROP POLICY IF EXISTS "coupons_delete_vendor" ON coupons;
DROP POLICY IF EXISTS "coupons_select_admin" ON coupons;

-- السياسة 1: الجميع يمكنهم رؤية الكوبونات النشطة والسارية
CREATE POLICY "coupons_select_public"
ON coupons FOR SELECT
TO public
USING (
  is_active = true
  AND start_date <= NOW()
  AND end_date >= NOW()
);

-- السياسة 2: الادمن يرى كل الكوبونات
CREATE POLICY "coupons_select_admin"
ON coupons FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- السياسة 3: البائع يرى كوبوناته فقط
CREATE POLICY "coupons_select_vendor"
ON coupons FOR SELECT
TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM stores 
    WHERE user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- السياسة 4: البائع يدرج كوبونات لمتجره فقط
CREATE POLICY "coupons_insert_vendor"
ON coupons FOR INSERT
TO authenticated
WITH CHECK (
  vendor_id IN (
    SELECT id FROM stores 
    WHERE user_id = auth.uid()
  )
);

-- السياسة 5: البائع يحدث كوبوناته فقط
CREATE POLICY "coupons_update_vendor"
ON coupons FOR UPDATE
TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM stores 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  vendor_id IN (
    SELECT id FROM stores 
    WHERE user_id = auth.uid()
  )
);

-- السياسة 6: البائع يحذف كوبوناته فقط
CREATE POLICY "coupons_delete_vendor"
ON coupons FOR DELETE
TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM stores 
    WHERE user_id = auth.uid()
  )
);

-- 5️⃣ إنشاء جدول coupon_usage لتتبع استخدام الكوبونات
CREATE TABLE IF NOT EXISTS coupon_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  order_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT non_negative_discount CHECK (discount_amount >= 0)
);

-- 6️⃣ إنشاء الفهارس لجدول coupon_usage
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_order_id ON coupon_usage(order_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_used_at ON coupon_usage(used_at);

-- 7️⃣ تفعيل RLS على جدول coupon_usage
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coupon_usage_select_admin" ON coupon_usage;
DROP POLICY IF EXISTS "coupon_usage_insert_system" ON coupon_usage;

-- السياسة 1: الادمن يرى جميع الاستخدامات
CREATE POLICY "coupon_usage_select_admin"
ON coupon_usage FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- السياسة 2: النظام يمكنه إدراج استخدامات جديدة (للدوال والـ triggers)
CREATE POLICY "coupon_usage_insert_system"
ON coupon_usage FOR INSERT
TO authenticated
WITH CHECK (true);

-- 8️⃣ دالة لتحديث عدد مرات استخدام الكوبون
CREATE OR REPLACE FUNCTION update_coupon_used_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE coupons
  SET used_count = used_count + 1,
      updated_at = NOW()
  WHERE id = NEW.coupon_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق trigger لتحديث عدد الاستخدام
DROP TRIGGER IF EXISTS trigger_update_coupon_used_count ON coupon_usage;
CREATE TRIGGER trigger_update_coupon_used_count
AFTER INSERT ON coupon_usage
FOR EACH ROW
EXECUTE FUNCTION update_coupon_used_count();

-- 9️⃣ التحقق من النتيجة
SELECT 
  'Coupons table created successfully' as status,
  COUNT(*) as total_coupons
FROM coupons;

SELECT 
  'Coupon usage table created successfully' as status,
  COUNT(*) as total_usages
FROM coupon_usage;
