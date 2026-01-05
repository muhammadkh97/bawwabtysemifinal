-- ============================================
-- إصلاح foreign key constraint لـ orders.driver_id
-- ============================================

-- 1. عرض الـ foreign key constraint الحالي
SELECT
    tc.constraint_name AS اسم_القيد,
    tc.table_name AS الجدول,
    kcu.column_name AS العمود,
    ccu.table_name AS الجدول_المرجعي,
    ccu.column_name AS العمود_المرجعي
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'orders'
  AND kcu.column_name = 'driver_id';

-- 2. حذف الـ foreign key constraint الخاطئ
ALTER TABLE orders
DROP CONSTRAINT IF EXISTS orders_driver_id_fkey;

-- 3. إنشاء foreign key constraint صحيح يشير إلى جدول drivers
ALTER TABLE orders
ADD CONSTRAINT orders_driver_id_fkey
FOREIGN KEY (driver_id)
REFERENCES drivers(id)
ON DELETE SET NULL;

-- 4. التحقق من التعديل
SELECT
    tc.constraint_name AS اسم_القيد,
    tc.table_name AS الجدول,
    kcu.column_name AS العمود,
    ccu.table_name AS الجدول_المرجعي,
    ccu.column_name AS العمود_المرجعي
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'orders'
  AND kcu.column_name = 'driver_id';

-- رسالة نجاح
SELECT '✅ تم إصلاح foreign key constraint' AS الحالة,
       'orders.driver_id الآن يشير إلى drivers.id' AS الرسالة;
