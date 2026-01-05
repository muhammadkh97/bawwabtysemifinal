-- ====================================
-- التحقق من RLS Policies على جداول الماليات
-- ====================================

-- 1. فحص جميع الـ policies على financial_settings
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
WHERE tablename = 'financial_settings';

-- 2. فحص جميع الـ policies على commissions
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
WHERE tablename = 'commissions';

-- 3. التحقق من أن RLS مفعل
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('financial_settings', 'commissions');
