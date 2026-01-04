-- ============================================
-- فحص triggers على جدول orders
-- ============================================

-- 1. قائمة بجميع triggers على جدول orders
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE event_object_table = 'orders';

-- 2. عرض تفاصيل functions المستخدمة
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname LIKE '%order%'
ORDER BY p.proname;
