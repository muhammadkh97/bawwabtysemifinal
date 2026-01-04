-- =====================================================
-- 🔍 سكريبتات فحص شاملة لصفحة الإحصائيات
-- =====================================================

-- =====================================================
-- 📊 السكريبت 1: فحص أعمدة order_items
-- =====================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'order_items'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 🔐 السكريبت 2: فحص RLS على order_items
-- =====================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'order_items'
AND schemaname = 'public';

-- =====================================================
-- 🛡️ السكريبت 3: فحص سياسات order_items
-- =====================================================
SELECT 
  policyname,
  cmd as operation,
  permissive,
  roles,
  CASE 
    WHEN length(qual) > 150 THEN substring(qual from 1 for 150) || '...'
    ELSE qual
  END as using_expression
FROM pg_policies
WHERE tablename = 'order_items'
ORDER BY policyname;

-- =====================================================
-- 🔑 السكريبت 4: فحص صلاحيات GRANT على order_items
-- =====================================================
SELECT 
  grantee, 
  table_name, 
  privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'order_items'
AND grantee IN ('authenticated', 'anon')
ORDER BY grantee, privilege_type;

-- =====================================================
-- 📊 السكريبت 5: فحص Foreign Keys في order_items
-- =====================================================
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'order_items'
AND tc.constraint_type = 'FOREIGN KEY';

-- =====================================================
-- 🔍 السكريبت 6: اختبار استعلام مباشر (للمستخدم الحالي)
-- =====================================================
SELECT 
  oi.order_id,
  oi.vendor_id,
  oi.total_price,
  o.status,
  o.created_at
FROM order_items oi
INNER JOIN orders o ON o.id = oi.order_id
WHERE oi.vendor_id = '6186f1a0-7f95-4d54-ac70-391127079a3f'
AND o.status = 'delivered'
LIMIT 5;

-- =====================================================
-- 📊 السكريبت 7: فحص جدول orders
-- =====================================================
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'orders'
AND table_schema = 'public'
AND column_name IN ('id', 'status', 'total_amount', 'created_at')
ORDER BY ordinal_position;

-- =====================================================
-- 🔐 السكريبت 8: فحص RLS على orders
-- =====================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'orders'
AND schemaname = 'public';
