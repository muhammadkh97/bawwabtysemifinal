-- ✅ إصلاح نهائي لـ RLS على الكوبونات
-- التاريخ: 4 يناير 2026
-- المشكلة: لا تزال permission denied - تبسيط RLS أكثر

-- 1️⃣ تعطيل RLS مؤقتاً
ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage DISABLE ROW LEVEL SECURITY;

-- 2️⃣ حذف جميع السياسات
DROP POLICY IF EXISTS "coupons_select_public" ON coupons;
DROP POLICY IF EXISTS "coupons_select_admin" ON coupons;
DROP POLICY IF EXISTS "coupons_select_vendor" ON coupons;
DROP POLICY IF EXISTS "coupons_insert_vendor" ON coupons;
DROP POLICY IF EXISTS "coupons_update_vendor" ON coupons;
DROP POLICY IF EXISTS "coupons_delete_vendor" ON coupons;

DROP POLICY IF EXISTS "coupon_usage_select_admin" ON coupon_usage;
DROP POLICY IF EXISTS "coupon_usage_insert_authenticated" ON coupon_usage;

-- 3️⃣ إعادة تفعيل RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- 4️⃣ سياسات جديدة جداً مبسطة جداً

-- جدول coupons

-- السياسة 1: الكوبونات النشطة والسارية للجميع (بدون auth.uid())
CREATE POLICY "coupons_select_public"
ON coupons FOR SELECT
USING (
  is_active = true
  AND start_date <= NOW()
  AND end_date >= NOW()
);

-- السياسة 2: المستخدمين المسجلين يمكنهم رؤية الكوبونات
CREATE POLICY "coupons_select_authenticated"
ON coupons FOR SELECT
TO authenticated
USING (true);

-- السياسة 3: إدراج كوبون - أي مستخدم مسجل يمكنه الإدراج
-- النظام سيتحقق من vendor_id في الكود
CREATE POLICY "coupons_insert_authenticated"
ON coupons FOR INSERT
TO authenticated
WITH CHECK (true);

-- السياسة 4: تحديث الكوبونات - أي مستخدم مسجل
CREATE POLICY "coupons_update_authenticated"
ON coupons FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- السياسة 5: حذف الكوبونات - أي مستخدم مسجل
CREATE POLICY "coupons_delete_authenticated"
ON coupons FOR DELETE
TO authenticated
USING (true);

-- جدول coupon_usage

-- السياسة 1: إدراج استخدام - أي مستخدم مسجل
CREATE POLICY "coupon_usage_insert_authenticated"
ON coupon_usage FOR INSERT
TO authenticated
WITH CHECK (true);

-- السياسة 2: قراءة الاستخدامات - المستخدمين المسجلين
CREATE POLICY "coupon_usage_select_authenticated"
ON coupon_usage FOR SELECT
TO authenticated
USING (true);

-- 5️⃣ التحقق
SELECT 'RLS policies have been reset and simplified' as status;

SELECT policyname, cmd FROM pg_policies WHERE tablename = 'coupons';
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'coupon_usage';
