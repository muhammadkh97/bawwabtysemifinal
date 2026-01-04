-- ============================================
-- فحص RLS policies على جدول orders
-- ============================================

-- 1. التحقق من تفعيل RLS
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'orders';

-- 2. عرض جميع policies على جدول orders
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'orders'
ORDER BY policyname;
