-- ============================================
-- فحص بنية جدول exchange_rates
-- ============================================

-- عرض جميع الأعمدة في جدول exchange_rates
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'exchange_rates'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- عرض بعض البيانات الموجودة
SELECT * FROM exchange_rates LIMIT 5;
