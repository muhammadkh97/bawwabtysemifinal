-- =====================================================
-- 🔍 سكريبتات فحص شاملة للمطاعم (Restaurants)
-- =====================================================

-- =====================================================
-- 📊 السكريبت 1: فحص وجود جدول restaurants
-- =====================================================
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'restaurants';

-- =====================================================
-- 📊 السكريبت 2: فحص جدول stores (البديل المحتمل)
-- =====================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'stores'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 🔍 السكريبت 3: فحص بيانات المطعم الحالي في stores
-- =====================================================
SELECT 
  id,
  user_id,
  name,
  type,
  description,
  address,
  phone,
  email,
  logo,
  banner,
  is_active,
  created_at,
  updated_at
FROM stores
WHERE user_id = '6a7c47f6-78a2-4975-a049-172dc783524d';

-- =====================================================
-- 🔐 السكريبت 4: فحص RLS على stores
-- =====================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'stores'
AND schemaname = 'public';

-- =====================================================
-- 🛡️ السكريبت 5: فحص سياسات RLS على stores
-- =====================================================
SELECT 
  policyname,
  cmd as operation,
  permissive,
  roles,
  CASE 
    WHEN length(qual) > 100 THEN substring(qual from 1 for 100) || '...'
    ELSE qual
  END as using_expression
FROM pg_policies
WHERE tablename = 'stores'
ORDER BY policyname;

-- =====================================================
-- 🔑 السكريبت 6: فحص صلاحيات GRANT على stores
-- =====================================================
SELECT 
  grantee, 
  table_name, 
  privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'stores'
AND grantee IN ('authenticated', 'anon', 'postgres')
ORDER BY grantee, privilege_type;

-- =====================================================
-- 📊 السكريبت 7: فحص Foreign Keys في stores
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
WHERE tc.table_name = 'stores'
AND tc.constraint_type = 'FOREIGN KEY';

-- =====================================================
-- 🔍 السكريبت 8: فحص عمود type في stores (للتفريق بين vendor و restaurant)
-- =====================================================
SELECT 
  type,
  COUNT(*) as count
FROM stores
GROUP BY type
ORDER BY count DESC;

-- =====================================================
-- 🔍 السكريبت 9: فحص جميع الجداول التي تحتوي على restaurant في اسمها
-- =====================================================
SELECT 
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%restaurant%';

-- =====================================================
-- 🔍 السكريبت 10: فحص views أو functions متعلقة بـ restaurants
-- =====================================================
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%restaurant%';

-- =====================================================
-- 🔍 السكريبت 11: فحص المستخدمين بدور restaurant
-- =====================================================
SELECT 
  id,
  email,
  full_name,
  role
FROM users
WHERE role = 'restaurant'
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- 🔍 السكريبت 12: اختبار العلاقة بين users و stores للمطاعم
-- =====================================================
SELECT 
  u.id as user_id,
  u.email,
  u.full_name,
  u.role,
  s.id as store_id,
  s.name as store_name,
  s.type as store_type
FROM users u
LEFT JOIN stores s ON s.user_id = u.id
WHERE u.role = 'restaurant'
LIMIT 5;
