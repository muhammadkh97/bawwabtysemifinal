-- ============================================================================
-- فحص مشكلة تأكيد التوصيل من قبل السائق
-- ============================================================================

-- 1. فحص الطلب المحدد
SELECT 
  id,
  order_number,
  status,
  driver_id,
  customer_id,
  store_id,
  total_amount,
  delivery_fee,
  created_at
FROM orders
WHERE id = 'a5b017a7-4308-433d-bfe5-8eb5935ab6eb';

-- 2. فحص جميع أعمدة جدول orders
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- 3. فحص constraints على جدول orders
SELECT
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  CASE con.contype
    WHEN 'c' THEN 'CHECK'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 't' THEN 'TRIGGER'
    ELSE con.contype::text
  END AS constraint_type_full,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'orders';

-- 4. فحص سياسات RLS على جدول orders
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
WHERE tablename = 'orders'
ORDER BY policyname;

-- 5. فحص صلاحيات UPDATE على جدول orders
SELECT 
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'orders'
  AND privilege_type = 'UPDATE';

-- 6. فحص السائق المرتبط بالطلب
SELECT 
  d.id AS driver_id,
  d.user_id,
  u.email,
  u.full_name,
  d.status AS driver_status,
  d.is_available
FROM drivers d
JOIN auth.users u ON u.id = d.user_id
WHERE d.id = (SELECT driver_id FROM orders WHERE id = 'a5b017a7-4308-433d-bfe5-8eb5935ab6eb');

-- 7. فحص الحالات المسموح بها للطلبات
SELECT DISTINCT status
FROM orders
ORDER BY status;

-- 8. فحص إذا كان هناك enum لحالات الطلبات
SELECT 
  t.typname AS enum_name,
  e.enumlabel AS enum_value,
  e.enumsortorder
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname LIKE '%order%status%'
ORDER BY t.typname, e.enumsortorder;
