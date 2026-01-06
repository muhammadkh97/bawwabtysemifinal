-- ============================================
-- فحص صفحة الطلبات - المطعم
-- Restaurant Orders Page Check
-- ============================================

-- ========== 1. فحص جدول orders ==========

SELECT 
  'orders' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') as exists;

-- فحص الأعمدة المطلوبة في orders
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name IN (
  'id', 'vendor_id', 'order_number', 'total', 'status',
  'created_at', 'delivery_address', 'customer_name', 'customer_phone'
)
ORDER BY column_name;

-- ========== 2. فحص قيم status في orders ==========

SELECT DISTINCT status 
FROM orders
ORDER BY status;

-- ========== 3. فحص وجود order_number ==========

SELECT 
  'order_number' as column_name,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders'
    AND column_name = 'order_number'
  ) as exists;

-- ========== 4. فحص وجود total ==========

SELECT 
  'total' as column_name,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders'
    AND column_name = 'total'
  ) as exists,
  data_type
FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name = 'total';

-- ========== 5. إحصائيات الطلبات ==========

-- عدد الطلبات الكلي
SELECT 
  'Total orders' as stat_name,
  COUNT(*) as count
FROM orders;

-- عدد الطلبات حسب الحالة
SELECT 
  status,
  COUNT(*) as count
FROM orders
GROUP BY status
ORDER BY count DESC;

-- ========== 6. اختبار الاستعلامات ==========

-- اختبار جلب الطلبات حسب vendor_id
SELECT 
  'Test: Get orders by vendor_id' as test_name,
  EXISTS (
    SELECT 1 FROM orders
    WHERE vendor_id IS NOT NULL
    LIMIT 1
  ) as can_execute;

-- اختبار الترتيب حسب تاريخ الإنشاء
SELECT 
  'Test: Order by created_at' as test_name,
  EXISTS (
    SELECT 1 FROM orders
    ORDER BY created_at DESC
    LIMIT 1
  ) as can_execute;

-- ========== 7. فحص RLS Policies على orders ==========

SELECT 
  'orders RLS policies' as table_name,
  COUNT(*) as policies_count
FROM pg_policies
WHERE tablename = 'orders';

-- ========== 8. الملخص النهائي ==========

SELECT 
  'الأعمدة الأساسية' as category,
  COUNT(CASE WHEN column_name IN (
    'id', 'vendor_id', 'order_number', 'total', 'status',
    'created_at', 'delivery_address', 'customer_name', 'customer_phone'
  ) THEN 1 END) as found,
  9 as required
FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name IN (
  'id', 'vendor_id', 'order_number', 'total', 'status',
  'created_at', 'delivery_address', 'customer_name', 'customer_phone'
);

-- تم الفحص ✅
