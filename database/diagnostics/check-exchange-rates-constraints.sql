-- ============================================================================
-- فحص قيود جدول exchange_rates
-- ============================================================================

-- 1. فحص جميع القيود على الجدول
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'exchange_rates'::regclass
ORDER BY conname;

-- 2. فحص بنية الجدول الكاملة
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'exchange_rates'
ORDER BY ordinal_position;
