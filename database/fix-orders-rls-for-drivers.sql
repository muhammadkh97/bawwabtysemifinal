-- ============================================
-- فحص وإصلاح RLS Policies لجدول orders
-- ============================================

-- 1. عرض جميع الـ policies الحالية على جدول orders
SELECT 
  schemaname,
  tablename,
  policyname AS اسم_السياسة,
  permissive AS نوع_السماح,
  roles AS الأدوار,
  cmd AS الأمر,
  qual AS الشرط,
  with_check AS شرط_الإدراج
FROM pg_policies
WHERE tablename = 'orders';

-- 2. حذف أي policy قد تمنع السائقين من رؤية الطلبات المتاحة
DROP POLICY IF EXISTS "Drivers can view assigned orders" ON orders;
DROP POLICY IF EXISTS "Drivers view orders" ON orders;

-- 3. إنشاء policy جديدة للسائقين
CREATE POLICY "Drivers can view available and assigned orders"
ON orders FOR SELECT
TO authenticated
USING (
  -- السائق يرى الطلبات المتاحة (بدون سائق) أو المُسندة له
  driver_id IS NULL 
  OR 
  driver_id IN (
    SELECT id FROM drivers WHERE user_id = auth.uid()
  )
);

-- 4. التحقق من الـ policies بعد التعديل
SELECT 
  policyname AS اسم_السياسة,
  cmd AS الأمر,
  qual AS الشرط
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY policyname;

-- 5. اختبار كسائق - هذا سيفشل إذا لم يكن هناك policy
-- (سيحتاج تشغيله من حساب السائق في التطبيق)
-- SELECT COUNT(*) FROM orders WHERE status = 'ready_for_pickup' AND driver_id IS NULL;

-- رسالة نجاح
SELECT '✅ تم إصلاح RLS policies لجدول orders' AS status,
       'السائقون يمكنهم الآن رؤية الطلبات المتاحة' AS message;
