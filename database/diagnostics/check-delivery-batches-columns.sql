-- ============================================================================
-- فحص أعمدة جدول delivery_batches
-- ============================================================================

-- فحص جميع الأعمدة في جدول delivery_batches
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'delivery_batches'
ORDER BY ordinal_position;
