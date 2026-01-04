-- ✅ إصلاح RLS Policies للكوبونات
-- التاريخ: 4 يناير 2026
-- المشكلة: permission denied for table coupons عند الإدراج

-- 1️⃣ تعطيل RLS مؤقتاً للتحقق من المشكلة
ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;

-- 2️⃣ حذف جميع السياسات القديمة
DROP POLICY IF EXISTS "coupons_select_public" ON coupons;
DROP POLICY IF EXISTS "coupons_select_vendor" ON coupons;
DROP POLICY IF EXISTS "coupons_insert_vendor" ON coupons;
DROP POLICY IF EXISTS "coupons_update_vendor" ON coupons;
DROP POLICY IF EXISTS "coupons_delete_vendor" ON coupons;
DROP POLICY IF EXISTS "coupons_select_admin" ON coupons;

-- 3️⃣ إعادة تفعيل RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- 4️⃣ إنشاء سياسات جديدة مبسطة وفعالة

-- السياسة 1: الجميع (anon و authenticated) يمكنهم رؤية الكوبونات النشطة والسارية
CREATE POLICY "coupons_select_public"
ON coupons FOR SELECT
TO public
USING (
  is_active = true
  AND start_date <= NOW()
  AND end_date >= NOW()
);

-- السياسة 2: الادمن يرى جميع الكوبونات
CREATE POLICY "coupons_select_admin"
ON coupons FOR SELECT
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- السياسة 3: البائع يرى كوبوناته فقط (أو إذا كان ادمن)
CREATE POLICY "coupons_select_vendor"
ON coupons FOR SELECT
TO authenticated
USING (
  vendor_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- السياسة 4: البائع يدرج كوبونات لمتجره فقط
CREATE POLICY "coupons_insert_vendor"
ON coupons FOR INSERT
TO authenticated
WITH CHECK (
  vendor_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
);

-- السياسة 5: البائع يحدث كوبوناته فقط (أو إذا كان ادمن)
CREATE POLICY "coupons_update_vendor"
ON coupons FOR UPDATE
TO authenticated
USING (
  vendor_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
)
WITH CHECK (
  vendor_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- السياسة 6: البائع يحذف كوبوناته فقط (أو إذا كان ادمن)
CREATE POLICY "coupons_delete_vendor"
ON coupons FOR DELETE
TO authenticated
USING (
  vendor_id IN (SELECT id FROM stores WHERE user_id = auth.uid())
  OR (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- 5️⃣ إصلاح RLS على جدول coupon_usage
ALTER TABLE coupon_usage DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coupon_usage_select_admin" ON coupon_usage;
DROP POLICY IF EXISTS "coupon_usage_insert_system" ON coupon_usage;

ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

-- السياسة 1: الادمن يرى جميع الاستخدامات
CREATE POLICY "coupon_usage_select_admin"
ON coupon_usage FOR SELECT
TO authenticated
USING (
  (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
);

-- السياسة 2: يمكن لأي مستخدم مسجل إدراج استخدام كوبون
CREATE POLICY "coupon_usage_insert_authenticated"
ON coupon_usage FOR INSERT
TO authenticated
WITH CHECK (true);

-- 6️⃣ التحقق من النتيجة
SELECT 
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE tablename = 'coupons'
ORDER BY policyname;

SELECT 
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE tablename = 'coupon_usage'
ORDER BY policyname;

-- 7️⃣ اختبار: جرب إدراج كوبون جديد
-- يجب أن تكون قادراً على الإدراج الآن بدون مشاكل
