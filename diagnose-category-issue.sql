-- ============================================================================
-- فحص مشكلة category_id في إضافة منتج جديد
-- ============================================================================

-- 1. عرض جميع التصنيفات الموجودة
SELECT 
  id,
  name,
  name_ar,
  slug,
  parent_id,
  is_active
FROM categories
ORDER BY name;

-- 2. عرض التصنيفات الرئيسية فقط (التي بدون parent)
SELECT 
  id,
  name,
  name_ar,
  slug,
  is_active
FROM categories
WHERE parent_id IS NULL
ORDER BY name;

-- 3. عرض التصنيفات الفرعية
SELECT 
  c.id,
  c.name,
  c.name_ar,
  p.name as parent_name,
  p.name_ar as parent_name_ar
FROM categories c
LEFT JOIN categories p ON c.parent_id = p.id
WHERE c.parent_id IS NOT NULL
ORDER BY p.name, c.name;

-- 4. فحص المنتجات الموجودة وتصنيفاتها
SELECT 
  p.id,
  p.name,
  p.category_id,
  c.name as category_name,
  c.name_ar as category_name_ar
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
ORDER BY p.created_at DESC
LIMIT 10;

-- 5. إحصائيات التصنيفات
SELECT 
  'Total Categories' as description,
  COUNT(*) as count
FROM categories
UNION ALL
SELECT 
  'Active Categories' as description,
  COUNT(*) as count
FROM categories
WHERE is_active = true
UNION ALL
SELECT 
  'Parent Categories' as description,
  COUNT(*) as count
FROM categories
WHERE parent_id IS NULL;
