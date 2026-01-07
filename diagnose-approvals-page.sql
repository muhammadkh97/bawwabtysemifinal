-- ============================================================================
-- فحص صفحة الموافقات - المنتجات، البائعين، والسائقين
-- ============================================================================

-- 1. فحص المنتجات المعلقة
SELECT 
  p.id,
  p.name,
  p.price,
  p.category_id,
  p.vendor_id,
  p.approval_status,
  p.created_at,
  c.name as category_name,
  c.name_ar as category_name_ar,
  s.name as store_name,
  s.name_ar as store_name_ar
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN stores s ON p.vendor_id = s.id
WHERE p.approval_status = 'pending'
ORDER BY p.created_at DESC
LIMIT 5;

-- 2. فحص المفاتيح الخارجية لجدول products
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
  AND tc.table_name = 'products'
ORDER BY tc.constraint_name;

-- 3. فحص البائعين المعلقين (stores)
SELECT 
  s.id,
  s.name,
  s.name_ar,
  s.shop_name,
  s.shop_name_ar,
  s.email,
  s.phone,
  s.approval_status,
  s.user_id,
  s.created_at,
  u.full_name as user_name,
  u.email as user_email,
  u.phone as user_phone
FROM stores s
LEFT JOIN users u ON s.user_id = u.id
WHERE s.approval_status = 'pending'
ORDER BY s.created_at DESC
LIMIT 5;

-- 4. فحص المفاتيح الخارجية لجدول stores
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
  AND tc.table_name = 'stores'
ORDER BY tc.constraint_name;

-- 5. فحص السائقين المعلقين (drivers table)
SELECT 
  d.id,
  d.user_id,
  d.license_number,
  d.vehicle_type,
  d.approval_status,
  d.created_at,
  u.full_name as user_name,
  u.email as user_email,
  u.phone as user_phone
FROM drivers d
LEFT JOIN users u ON d.user_id = u.id
WHERE d.approval_status = 'pending'
ORDER BY d.created_at DESC
LIMIT 5;

-- 6. فحص أعمدة جدول drivers
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'drivers'
ORDER BY ordinal_position;

-- 7. إحصائيات الموافقات
SELECT 
  'Products' as entity_type,
  approval_status,
  COUNT(*) as count
FROM products
GROUP BY approval_status
UNION ALL
SELECT 
  'Stores' as entity_type,
  approval_status,
  COUNT(*) as count
FROM stores
GROUP BY approval_status
UNION ALL
SELECT 
  'Drivers' as entity_type,
  approval_status,
  COUNT(*) as count
FROM drivers
GROUP BY approval_status
ORDER BY entity_type, approval_status;
