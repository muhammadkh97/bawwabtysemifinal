-- =====================================================
-- 🔍 سكريبتات فحص شاملة لجدول products والموافقات
-- =====================================================

-- =====================================================
-- 📊 السكريبت 1: فحص أعمدة جدول products
-- =====================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'products'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 🔍 السكريبت 2: فحص Foreign Keys في products
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
WHERE tc.table_name = 'products'
AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY kcu.column_name;

-- =====================================================
-- 🔍 السكريبت 3: البحث عن vendor_id في products
-- =====================================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
AND table_schema = 'public'
AND column_name LIKE '%vendor%'
ORDER BY ordinal_position;

-- =====================================================
-- 🔍 السكريبت 4: فحص أسماء جميع Foreign Keys في products
-- =====================================================
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  confrelid::regclass as foreign_table
FROM pg_constraint
WHERE conrelid = 'products'::regclass
AND contype = 'f';

-- =====================================================
-- 🔍 السكريبت 5: فحص العلاقة بين products و stores
-- =====================================================
SELECT 
  p.id,
  p.name,
  p.vendor_id,
  s.id as store_id,
  s.name as store_name,
  s.business_type
FROM products p
LEFT JOIN stores s ON s.id = p.vendor_id
LIMIT 5;

-- =====================================================
-- 🔍 السكريبت 6: فحص المنتجات المعلقة (pending)
-- =====================================================
SELECT 
  id,
  name,
  vendor_id,
  category_id,
  status,
  created_at
FROM products
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- 🔍 السكريبت 7: فحص عمود status في products
-- =====================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'products'
AND table_schema = 'public'
AND column_name = 'status';

-- =====================================================
-- 🔍 السكريبت 8: فحص القيم الممكنة لـ status
-- =====================================================
SELECT 
  e.enumlabel as status_value
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname LIKE '%status%'
AND EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name = 'products' 
  AND column_name = 'status'
  AND udt_name = t.typname
)
ORDER BY e.enumsortorder;

-- =====================================================
-- 🔍 السكريبت 9: فحص RLS على products
-- =====================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'products'
AND schemaname = 'public';

-- =====================================================
-- 🔍 السكريبت 10: فحص جدول vendors (إن وجد)
-- =====================================================
SELECT 
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'vendors';
