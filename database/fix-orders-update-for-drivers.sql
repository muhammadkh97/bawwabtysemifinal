-- ============================================
-- إضافة صلاحية التحديث للسائقين على جدول orders
-- ============================================

-- 1. عرض الـ policies الحالية للتحديث
SELECT 
  policyname AS اسم_السياسة,
  cmd AS الأمر,
  qual AS الشرط
FROM pg_policies
WHERE tablename = 'orders' AND cmd = 'UPDATE';

-- 2. حذف policy التحديث القديمة إن وجدت
DROP POLICY IF EXISTS "Drivers can update assigned orders" ON orders;
DROP POLICY IF EXISTS "Drivers update orders" ON orders;

-- 3. إنشاء policy للسماح للسائقين بقبول الطلبات (تحديث driver_id و status)
CREATE POLICY "Drivers can accept available orders"
ON orders FOR UPDATE
TO authenticated
USING (
  -- يمكن تحديث الطلبات المتاحة فقط (التي بدون سائق)
  driver_id IS NULL
)
WITH CHECK (
  -- يجب أن يكون السائق الذي يقوم بالتحديث هو من يسند الطلب لنفسه
  driver_id IN (
    SELECT id FROM drivers WHERE user_id = auth.uid()
  )
);

-- 4. إنشاء policy إضافية للسائقين لتحديث طلباتهم المسندة
CREATE POLICY "Drivers can update their assigned orders"
ON orders FOR UPDATE
TO authenticated
USING (
  -- السائق يمكنه تحديث الطلبات المسندة له فقط
  driver_id IN (
    SELECT id FROM drivers WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  -- يجب أن يظل الطلب مسنداً لنفس السائق
  driver_id IN (
    SELECT id FROM drivers WHERE user_id = auth.uid()
  )
);

-- 5. التحقق من الـ policies بعد التعديل
SELECT 
  policyname AS اسم_السياسة,
  cmd AS الأمر,
  qual AS شرط_القراءة,
  with_check AS شرط_الكتابة
FROM pg_policies
WHERE tablename = 'orders'
ORDER BY cmd, policyname;

-- رسالة نجاح
SELECT '✅ تم إضافة صلاحيات التحديث للسائقين' AS status,
       'السائقون يمكنهم الآن قبول الطلبات وتحديثها' AS message;
