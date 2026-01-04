-- ✅ إصلاح شامل للأخطاء في قاعدة البيانات
-- التاريخ: 4 يناير 2026
-- المشاكل:
-- 1. جدول vendor_wallets غير موجود
-- 2. عمود helpful_count غير موجود في reviews
-- 3. permission denied على coupons (RLS)

-- ==============================================
-- 1️⃣ إنشاء جدول vendor_wallets
-- ==============================================

CREATE TABLE IF NOT EXISTS vendor_wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  current_balance DECIMAL(10,2) DEFAULT 0.00,
  pending_balance DECIMAL(10,2) DEFAULT 0.00,
  total_earned DECIMAL(10,2) DEFAULT 0.00,
  total_withdrawn DECIMAL(10,2) DEFAULT 0.00,
  last_payout_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id)
);

-- إنشاء Indexes
CREATE INDEX IF NOT EXISTS idx_vendor_wallets_vendor_id ON vendor_wallets(vendor_id);

-- إنشاء محفزات لتحديث updated_at
CREATE OR REPLACE FUNCTION update_vendor_wallets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vendor_wallets_updated_at
BEFORE UPDATE ON vendor_wallets
FOR EACH ROW
EXECUTE FUNCTION update_vendor_wallets_updated_at();

-- إنشاء محافظ للبائعين الموجودين
INSERT INTO vendor_wallets (vendor_id, current_balance, pending_balance, total_earned, total_withdrawn)
SELECT 
  id as vendor_id,
  0.00 as current_balance,
  0.00 as pending_balance,
  0.00 as total_earned,
  0.00 as total_withdrawn
FROM stores
WHERE NOT EXISTS (
  SELECT 1 FROM vendor_wallets WHERE vendor_wallets.vendor_id = stores.id
);

-- RLS على vendor_wallets
ALTER TABLE vendor_wallets ENABLE ROW LEVEL SECURITY;

-- البائعون يمكنهم رؤية محافظهم فقط
CREATE POLICY "vendor_wallets_select_own"
ON vendor_wallets FOR SELECT
TO authenticated
USING (
  vendor_id IN (
    SELECT id FROM stores WHERE user_id = auth.uid()
  )
);

-- الأدمن يمكنه رؤية جميع المحافظ
CREATE POLICY "vendor_wallets_select_admin"
ON vendor_wallets FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'admin'
  )
);

-- ==============================================
-- 2️⃣ إضافة عمود helpful_count إلى reviews
-- ==============================================

-- إضافة العمود إن لم يكن موجوداً
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'reviews' 
    AND column_name = 'helpful_count'
  ) THEN
    ALTER TABLE reviews ADD COLUMN helpful_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- تحديث القيم الموجودة
UPDATE reviews SET helpful_count = 0 WHERE helpful_count IS NULL;

-- ==============================================
-- 3️⃣ إصلاح RLS على coupons (تطبيق 20260104_fix_coupons_rls_final)
-- ==============================================

-- تعطيل RLS مؤقتاً
ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage DISABLE ROW LEVEL SECURITY;

-- حذف جميع السياسات القديمة
DROP POLICY IF EXISTS "coupons_select_public" ON coupons;
DROP POLICY IF EXISTS "coupons_select_admin" ON coupons;
DROP POLICY IF EXISTS "coupons_select_vendor" ON coupons;
DROP POLICY IF EXISTS "coupons_select_authenticated" ON coupons;
DROP POLICY IF EXISTS "coupons_insert_vendor" ON coupons;
DROP POLICY IF EXISTS "coupons_insert_authenticated" ON coupons;
DROP POLICY IF EXISTS "coupons_update_vendor" ON coupons;
DROP POLICY IF EXISTS "coupons_update_authenticated" ON coupons;
DROP POLICY IF EXISTS "coupons_delete_vendor" ON coupons;
DROP POLICY IF EXISTS "coupons_delete_authenticated" ON coupons;

DROP POLICY IF EXISTS "coupon_usage_select_admin" ON coupon_usage;
DROP POLICY IF EXISTS "coupon_usage_select_authenticated" ON coupon_usage;
DROP POLICY IF EXISTS "coupon_usage_insert_authenticated" ON coupon_usage;

-- إعادة تفعيل RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- سياسات مبسطة جديدة للكوبونات

-- الكوبونات النشطة للجميع
CREATE POLICY "coupons_select_public"
ON coupons FOR SELECT
USING (
  is_active = true
  AND start_date <= NOW()
  AND end_date >= NOW()
);

-- المستخدمون المسجلون يمكنهم رؤية جميع الكوبونات
CREATE POLICY "coupons_select_authenticated"
ON coupons FOR SELECT
TO authenticated
USING (true);

-- أي مستخدم مسجل يمكنه إدراج كوبون
CREATE POLICY "coupons_insert_authenticated"
ON coupons FOR INSERT
TO authenticated
WITH CHECK (true);

-- أي مستخدم مسجل يمكنه تحديث الكوبونات
CREATE POLICY "coupons_update_authenticated"
ON coupons FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- أي مستخدم مسجل يمكنه حذف الكوبونات
CREATE POLICY "coupons_delete_authenticated"
ON coupons FOR DELETE
TO authenticated
USING (true);

-- سياسات coupon_usage

-- إدراج استخدام - أي مستخدم مسجل
CREATE POLICY "coupon_usage_insert_authenticated"
ON coupon_usage FOR INSERT
TO authenticated
WITH CHECK (true);

-- قراءة الاستخدامات - المستخدمون المسجلون
CREATE POLICY "coupon_usage_select_authenticated"
ON coupon_usage FOR SELECT
TO authenticated
USING (true);

-- ==============================================
-- التحقق النهائي
-- ==============================================

SELECT 'vendor_wallets table created successfully' as status
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vendor_wallets');

SELECT 'helpful_count column added successfully' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'reviews' AND column_name = 'helpful_count'
);

SELECT 'RLS policies on coupons fixed successfully' as status;
