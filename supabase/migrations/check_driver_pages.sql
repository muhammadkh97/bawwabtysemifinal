-- =====================================================
-- 🔍 سكريبت فحص Foreign Keys في جدول orders للسائق
-- =====================================================

-- =====================================================
-- 📊 السكريبت 1: فحص جميع Foreign Keys في orders
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
-- 📊 السكريبت 2: فحص الأعمدة في جدول orders
-- =====================================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
AND table_schema = 'public'
AND column_name IN ('customer_id', 'user_id', 'vendor_id', 'restaurant_id', 'driver_id')
ORDER BY ordinal_position;

-- =====================================================
-- 📊 السكريبت 3: التحقق من وجود جدول restaurants
-- =====================================================
SELECT 
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('restaurants', 'stores', 'vendors');
