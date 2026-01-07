-- Check exact data types for all columns in products table
SELECT 
  column_name,
  data_type,
  udt_name,
  CASE 
    WHEN data_type = 'ARRAY' THEN 'TEXT[]'
    WHEN data_type = 'USER-DEFINED' THEN udt_name
    WHEN data_type = 'character varying' THEN 'VARCHAR'
    ELSE data_type
  END as simplified_type
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
