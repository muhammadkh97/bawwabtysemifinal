-- ============================================================================
-- فحص العلاقة بين orders و delivery_batches
-- ============================================================================

-- 1. فحص أعمدة جدول orders
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name LIKE '%batch%'
ORDER BY ordinal_position;

-- 2. فحص جميع أعمدة orders (أول 20 عمود)
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position
LIMIT 20;

-- 3. فحص المفاتيح الخارجية في جدول orders
SELECT 
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'orders'
ORDER BY tc.constraint_name;

-- 4. فحص جدول delivery_batches
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'delivery_batches'
ORDER BY ordinal_position;

-- 5. فحص وجود جدول delivery_batches
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'delivery_batches';

-- 6. عرض عينة من بيانات orders
SELECT 
  id,
  vendor_id,
  customer_id,
  status,
  created_at
FROM orders
WHERE vendor_id = '01004b74-a0b9-4ddb-b115-0f03331dbe62'
ORDER BY created_at DESC
LIMIT 5;
