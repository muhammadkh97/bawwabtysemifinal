-- ============================================================================
-- تشخيص مشكلة صلاحيات جدول exchange_rates
-- ============================================================================

-- 1. فحص وجود الجدول والأعمدة
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'exchange_rates'
ORDER BY ordinal_position;

-- 2. فحص جميع سياسات RLS على الجدول
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
WHERE tablename = 'exchange_rates'
ORDER BY policyname;

-- 3. التحقق من تفعيل RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'exchange_rates';

-- 4. فحص الصلاحيات الممنوحة على الجدول
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'exchange_rates';

-- 5. عرض بيانات نموذجية من الجدول (إن وجدت)
SELECT 
  base_currency,
  target_currency,
  rate,
  last_updated,
  source
FROM exchange_rates
LIMIT 10;

-- 6. فحص إجمالي السجلات
SELECT COUNT(*) as total_records
FROM exchange_rates;
