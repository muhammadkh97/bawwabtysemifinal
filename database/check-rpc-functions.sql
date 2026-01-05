-- ====================================
-- فحص جميع الـ RPC Functions الموجودة
-- ====================================

-- 1. فحص جميع النسخ من get_admin_dashboard_stats
SELECT 
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'get_admin_dashboard_stats'
ORDER BY n.nspname;

-- 2. استدعاء الدالة مباشرة
SELECT * FROM get_admin_dashboard_stats();

-- 3. استدعاء الدالة من schema محدد
SELECT * FROM public.get_admin_dashboard_stats();
