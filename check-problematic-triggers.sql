-- ============================================================================
-- فحص وإصلاح جميع triggers التي قد تسبب numeric overflow
-- ============================================================================

-- 1. فحص trigger_calculate_commission
SELECT 
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
WHERE p.proname = 'calculate_commission_on_delivery';

-- 2. فحص trigger_update_vendor_wallet
SELECT 
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
WHERE p.proname = 'update_vendor_wallet';

-- 3. فحص trigger_update_batch_totals
SELECT 
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
WHERE p.proname = 'update_batch_totals';
