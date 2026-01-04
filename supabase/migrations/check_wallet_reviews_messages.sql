-- =====================================================
-- 🔍 سكريبتات فحص لمشاكل المحفظة والتقييمات والرسائل
-- =====================================================

-- =====================================================
-- 📊 السكريبت 1: فحص قيم status في orders
-- =====================================================
SELECT 
  e.enumlabel as status_value
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'order_status'
ORDER BY e.enumsortorder;

-- =====================================================
-- 🔍 السكريبت 2: فحص Foreign Keys في reviews
-- =====================================================
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'reviews'
AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY kcu.column_name;

-- =====================================================
-- 🔍 السكريبت 3: فحص Foreign Keys في orders
-- =====================================================
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'orders'
AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY kcu.column_name;

-- =====================================================
-- 🔍 السكريبت 4: فحص أعمدة orders المتعلقة بـ notes
-- =====================================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
AND table_schema = 'public'
AND (column_name LIKE '%note%' OR column_name LIKE '%message%')
ORDER BY ordinal_position;

-- =====================================================
-- 🔍 السكريبت 5: اختبار استعلام orders حسب status
-- =====================================================
SELECT 
  status,
  COUNT(*) as count
FROM orders
WHERE vendor_id = '01004b74-a0b9-4ddb-b115-0f03331dbe62'
GROUP BY status
ORDER BY count DESC;
