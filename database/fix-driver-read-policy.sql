-- ============================================
-- فحص وإصلاح RLS policies لقراءة الطلبات المسندة للسائق
-- ============================================

-- 1. عرض جميع الـ SELECT policies على جدول orders
SELECT 
  policyname AS اسم_السياسة,
  cmd AS الأمر,
  qual AS الشرط
FROM pg_policies
WHERE tablename = 'orders' 
  AND cmd = 'SELECT'
ORDER BY policyname;

-- 2. اختبار: هل السائق يمكنه قراءة طلباته؟
-- (نفذ هذا كسائق في التطبيق، لكن للتوضيح فقط)
-- SET LOCAL role authenticated;
-- SELECT id, order_number, status FROM orders WHERE driver_id = '0215b40e-8c6f-4369-8c91-645d06b295e8';

-- 3. تحديث policy القراءة للسائقين لتشمل الطلبات المسندة لهم
-- أولاً: حذف policy القديمة إن وجدت
DROP POLICY IF EXISTS "Drivers can view available and assigned orders" ON orders;

-- ثانياً: إنشاء policy جديدة شاملة
CREATE POLICY "Drivers can view available and assigned orders"
ON orders FOR SELECT
TO authenticated
USING (
  -- السائق يرى:
  -- 1. الطلبات المتاحة (بدون سائق) في أي حالة
  driver_id IS NULL 
  OR 
  -- 2. الطلبات المُسندة له في جميع الحالات
  driver_id IN (
    SELECT id FROM drivers WHERE user_id = auth.uid()
  )
);

-- 4. التحقق من الـ policy الجديدة
SELECT 
  policyname AS اسم_السياسة,
  cmd AS الأمر,
  qual AS الشرط
FROM pg_policies
WHERE tablename = 'orders' 
  AND cmd = 'SELECT'
ORDER BY policyname;

-- رسالة نجاح
SELECT '✅ تم تحديث SELECT policy للسائقين' AS الحالة,
       'السائقون يمكنهم الآن رؤية الطلبات المتاحة والمسندة لهم' AS الرسالة;
