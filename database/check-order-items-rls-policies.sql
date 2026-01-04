-- ============================================
-- فحص RLS policies على جدول order_items
-- ============================================

-- 1. التحقق من تفعيل RLS
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'order_items';

-- 2. عرض جميع policies على جدول order_items
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
  AND tablename = 'order_items'
ORDER BY policyname;
