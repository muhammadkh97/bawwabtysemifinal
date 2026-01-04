-- =====================================================
-- 🔍 سكريبتات فحص جدول orders للمطاعم
-- =====================================================

-- =====================================================
-- 📊 السكريبت 1: فحص أعمدة جدول orders
-- =====================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'orders'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 🔍 السكريبت 2: البحث عن أعمدة تحتوي على restaurant أو vendor
-- =====================================================
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'orders'
AND table_schema = 'public'
AND (column_name LIKE '%restaurant%' OR column_name LIKE '%vendor%')
ORDER BY ordinal_position;

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
-- 🔍 السكريبت 4: فحص Functions المتوفرة للمطاعم
-- =====================================================
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND (routine_name LIKE '%restaurant%' OR routine_name LIKE '%dashboard%')
ORDER BY routine_name;

-- =====================================================
-- 🔍 السكريبت 5: اختبار جلب طلبات المطعم
-- =====================================================
SELECT 
  id,
  customer_id,
  vendor_id,
  status,
  total_amount,
  created_at
FROM orders
WHERE vendor_id = '01004b74-a0b9-4ddb-b115-0f03331dbe62'
ORDER BY created_at DESC
LIMIT 5;
