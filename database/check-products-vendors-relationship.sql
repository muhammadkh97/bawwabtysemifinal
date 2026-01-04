-- ============================================
-- فحص العلاقة بين products و vendors
-- ============================================

-- عرض جميع foreign keys في جدول products
SELECT
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='products'
ORDER BY kcu.column_name;

-- التحقق من عمود vendor_id في جدول products
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'products'
  AND column_name = 'vendor_id';

-- عرض اسم جدول البائعين
SELECT 
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (table_name LIKE '%vendor%' OR table_name LIKE '%store%')
ORDER BY table_name;
