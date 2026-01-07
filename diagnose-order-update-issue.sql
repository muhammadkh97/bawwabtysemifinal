-- ============================================================================
-- فحص إضافي لمشكلة تحديث الطلب
-- ============================================================================

-- 1. فحص الطلب المحدد بالتفصيل
SELECT 
  id,
  order_number,
  status,
  driver_id,
  customer_id,
  vendor_id,
  total,
  delivery_fee,
  created_at
FROM orders
WHERE id = 'a5b017a7-4308-433d-bfe5-8eb5935ab6eb';

-- 2. فحص جميع الـ triggers على جدول orders
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing,
  action_orientation
FROM information_schema.triggers
WHERE event_object_table = 'orders';

-- 3. فحص الـ functions المرتبطة بـ triggers على orders
SELECT 
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname ILIKE '%order%'
  AND n.nspname = 'public'
ORDER BY p.proname;

-- 4. محاولة تحديث تجريبية (فقط لعرض الخطأ)
-- لا تنفذ هذا إلا إذا كنت متأكد
-- UPDATE orders 
-- SET status = 'delivered' 
-- WHERE id = 'a5b017a7-4308-433d-bfe5-8eb5935ab6eb';

-- 5. فحص السائق الحالي للطلب
SELECT 
  o.id AS order_id,
  o.driver_id,
  d.user_id AS driver_user_id,
  u.email AS driver_email
FROM orders o
LEFT JOIN drivers d ON o.driver_id = d.id
LEFT JOIN auth.users u ON d.user_id = u.id
WHERE o.id = 'a5b017a7-4308-433d-bfe5-8eb5935ab6eb';

-- 6. فحص السياسات التي تطبق على UPDATE للسائقين فقط
SELECT 
  policyname,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies
WHERE tablename = 'orders'
  AND cmd = 'UPDATE'
  AND policyname ILIKE '%driver%';
