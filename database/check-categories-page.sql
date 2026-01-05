-- ====================================
-- فحص صفحة Categories (الفئات)
-- ====================================

-- 1. فحص جدول categories
SELECT 
  'categories table' as check_name,
  COUNT(*) as total_categories,
  COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN approval_status = 'rejected' THEN 1 END) as rejected,
  COUNT(CASE WHEN parent_id IS NULL THEN 1 END) as root_categories,
  COUNT(CASE WHEN parent_id IS NOT NULL THEN 1 END) as subcategories
FROM categories;

-- 2. عرض أعمدة جدول categories
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'categories'
ORDER BY ordinal_position;

-- 3. عرض الفئات المعتمدة
SELECT 
  id,
  name,
  name_ar,
  parent_id,
  approval_status,
  display_order,
  is_active
FROM categories
WHERE approval_status = 'approved'
ORDER BY display_order
LIMIT 10;

-- 4. عرض الفئات المعلقة
SELECT 
  id,
  name,
  name_ar,
  parent_id,
  approval_status,
  created_by,
  created_at
FROM categories
WHERE approval_status = 'pending'
ORDER BY created_at DESC
LIMIT 5;

-- 5. فحص foreign key parent_id
SELECT 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'categories'
  AND tc.constraint_type = 'FOREIGN KEY';

-- 6. عد المنتجات لكل فئة
SELECT 
  c.id,
  c.name,
  c.name_ar,
  COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON p.category_id = c.id
WHERE c.approval_status = 'approved'
GROUP BY c.id, c.name, c.name_ar
ORDER BY product_count DESC
LIMIT 10;

-- 7. التحقق من الهيكل الشجري
SELECT 
  parent.name as parent_name,
  parent.name_ar as parent_name_ar,
  child.name as child_name,
  child.name_ar as child_name_ar
FROM categories parent
LEFT JOIN categories child ON child.parent_id = parent.id
WHERE parent.parent_id IS NULL
  AND parent.approval_status = 'approved'
ORDER BY parent.display_order, child.display_order
LIMIT 10;

-- 8. ملخص النتائج
SELECT 
  'Categories Summary' as section,
  json_build_object(
    'total', (SELECT COUNT(*) FROM categories),
    'approved', (SELECT COUNT(*) FROM categories WHERE approval_status = 'approved'),
    'pending', (SELECT COUNT(*) FROM categories WHERE approval_status = 'pending'),
    'with_products', (SELECT COUNT(DISTINCT category_id) FROM products)
  ) as summary;
