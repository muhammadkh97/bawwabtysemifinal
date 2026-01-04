-- =====================================================
-- 🔍 سكريبتات فحص شاملة لجدول التقييمات (reviews)
-- =====================================================

-- =====================================================
-- 📊 السكريبت 1: فحص جميع أعمدة جدول reviews
-- =====================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'reviews'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 🔐 السكريبت 2: فحص RLS على جدول reviews
-- =====================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'reviews'
AND schemaname = 'public';

-- =====================================================
-- 🛡️ السكريبت 3: فحص سياسات RLS على reviews
-- =====================================================
SELECT 
  policyname,
  cmd as operation,
  permissive,
  roles,
  CASE 
    WHEN length(qual) > 150 THEN substring(qual from 1 for 150) || '...'
    ELSE qual
  END as using_expression,
  CASE 
    WHEN length(with_check) > 150 THEN substring(with_check from 1 for 150) || '...'
    ELSE with_check
  END as with_check_expression
FROM pg_policies
WHERE tablename = 'reviews'
ORDER BY policyname;

-- =====================================================
-- 🔑 السكريبت 4: فحص صلاحيات GRANT على reviews
-- =====================================================
SELECT 
  grantee, 
  table_name, 
  privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'reviews'
AND grantee IN ('authenticated', 'anon', 'postgres')
ORDER BY grantee, privilege_type;

-- =====================================================
-- 📊 السكريبت 5: فحص Foreign Keys في reviews
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
WHERE tc.table_name = 'reviews'
AND tc.constraint_type = 'FOREIGN KEY';

-- =====================================================
-- 🔍 السكريبت 6: فحص Indexes على reviews
-- =====================================================
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'reviews'
AND schemaname = 'public'
ORDER BY indexname;

-- =====================================================
-- 📊 السكريبت 7: فحص عدد التقييمات في الجدول
-- =====================================================
SELECT 
  COUNT(*) as total_reviews,
  COUNT(DISTINCT customer_id) as unique_customers,
  COUNT(DISTINCT product_id) as unique_products,
  AVG(rating) as average_rating,
  MIN(rating) as min_rating,
  MAX(rating) as max_rating
FROM reviews;

-- =====================================================
-- 🔍 السكريبت 8: عينة من البيانات (أول 5 تقييمات)
-- =====================================================
SELECT 
  id,
  customer_id,
  product_id,
  rating,
  created_at,
  updated_at
FROM reviews
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- 🔍 السكريبت 9: فحص العلاقة مع جدول products
-- =====================================================
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'products'
AND table_schema = 'public'
AND column_name IN ('id', 'vendor_id', 'name', 'created_at')
ORDER BY ordinal_position;

-- =====================================================
-- 🔍 السكريبت 10: فحص العلاقة مع جدول users
-- =====================================================
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'users'
AND table_schema = 'public'
AND column_name IN ('id', 'email', 'full_name', 'role')
ORDER BY ordinal_position;

-- =====================================================
-- 🔍 السكريبت 11: اختبار استعلام مباشر مع البيانات المرتبطة
-- =====================================================
SELECT 
  r.id,
  r.rating,
  r.comment,
  r.created_at,
  r.customer_id,
  r.product_id,
  p.name as product_name,
  p.vendor_id
FROM reviews r
INNER JOIN products p ON p.id = r.product_id
WHERE p.vendor_id = '6186f1a0-7f95-4d54-ac70-391127079a3f'
ORDER BY r.created_at DESC
LIMIT 5;

-- =====================================================
-- 🔍 السكريبت 12: فحص جميع Constraints على reviews
-- =====================================================
SELECT
  conname as constraint_name,
  contype as constraint_type,
  CASE contype
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 'c' THEN 'CHECK'
    ELSE contype::text
  END as constraint_type_description
FROM pg_constraint
WHERE conrelid = 'reviews'::regclass
ORDER BY contype, conname;
