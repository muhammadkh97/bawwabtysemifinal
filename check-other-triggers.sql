-- ============================================================================
-- فحص الـ BEFORE triggers الأخرى التي قد تسبب المشكلة
-- ============================================================================

-- 1. فحص sync_orders_location_geography
SELECT 
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS full_definition
FROM pg_proc p
WHERE p.proname = 'sync_orders_location_geography';

-- 2. فحص validate_currency_code
SELECT 
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS full_definition
FROM pg_proc p
WHERE p.proname = 'validate_currency_code';

-- 3. فحص sync_order_delivery_location
SELECT 
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS full_definition
FROM pg_proc p
WHERE p.proname = 'sync_order_delivery_location';

-- 4. فحص update_updated_at_column
SELECT 
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS full_definition
FROM pg_proc p
WHERE p.proname = 'update_updated_at_column';

-- 5. فحص trigger_update_batch_stats (AFTER trigger)
SELECT 
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS full_definition
FROM pg_proc p
WHERE p.proname = 'trigger_update_batch_stats';
