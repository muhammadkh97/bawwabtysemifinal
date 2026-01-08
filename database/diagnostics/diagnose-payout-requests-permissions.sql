-- ============================================================================
-- تشخيص صلاحيات جدول payout_requests
-- ============================================================================

-- 1. فحص وجود الجدول والأعمدة
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'payout_requests'
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
WHERE tablename = 'payout_requests'
ORDER BY policyname;

-- 3. التحقق من تفعيل RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'payout_requests';

-- 4. فحص الصلاحيات الممنوحة على الجدول
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'payout_requests'
ORDER BY grantee, privilege_type;

-- 5. فحص العلاقة مع جدول stores (المفتاح الخارجي)
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
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'payout_requests';

-- 6. عرض عينة من البيانات (إن وجدت)
SELECT 
  id,
  vendor_id,
  amount,
  status,
  bank_name,
  requested_at
FROM payout_requests
LIMIT 5;

-- 7. إحصائيات الجدول
SELECT 
  status,
  COUNT(*) as count
FROM payout_requests
GROUP BY status;
