-- ============================================
-- فحص قاعدة البيانات لصفحة إضافة وجبة جديدة
-- Check Database for Add New Meal Page
-- ============================================

-- ========== 1. فحص الأعمدة المطلوبة في products ==========

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN (
  'id', 'vendor_id', 'name', 'description', 'category_id',
  'price', 'old_price', 'stock', 'low_stock_threshold',
  'images', 'featured_image', 'status', 'slug',
  'has_variants', 'variants', 'attributes', 'is_active',
  'original_currency'
)
ORDER BY column_name;

-- ========== 2. فحص عمود original_currency ==========

SELECT 
  'original_currency' as column_name,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products'
    AND column_name = 'original_currency'
  ) as exists;

-- ========== 3. فحص نوع بيانات variants ==========

SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name = 'variants';

-- ========== 4. فحص نوع بيانات attributes ==========

SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name = 'attributes';

-- ========== 5. فحص Storage Bucket للصور ==========

SELECT 
  'products storage bucket' as check_name,
  EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE name = 'products'
  ) as exists;

-- ========== 6. فحص قيم status المسموحة ==========

SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name = 'status';

-- ========== 7. الملخص النهائي ==========

SELECT 
  'الأعمدة المطلوبة' as category,
  COUNT(CASE WHEN column_name IN (
    'id', 'vendor_id', 'name', 'description', 'category_id',
    'price', 'old_price', 'stock', 'low_stock_threshold',
    'images', 'featured_image', 'status', 'slug',
    'has_variants', 'variants', 'attributes', 'is_active',
    'original_currency'
  ) THEN 1 END) as found,
  18 as required
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN (
  'id', 'vendor_id', 'name', 'description', 'category_id',
  'price', 'old_price', 'stock', 'low_stock_threshold',
  'images', 'featured_image', 'status', 'slug',
  'has_variants', 'variants', 'attributes', 'is_active',
  'original_currency'
);

-- تم الفحص ✅
