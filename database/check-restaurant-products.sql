-- ============================================
-- فحص صفحة قائمة الطعام - المطعم
-- Restaurant Products Page Check
-- ============================================

-- ========== 1. فحص جدول products ==========

SELECT 
  'products' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') as exists;

-- فحص الأعمدة المطلوبة في products
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN (
  'id', 'vendor_id', 'name', 'name_ar', 'description', 'description_ar',
  'price', 'sale_price', 'images', 'is_active', 'stock', 'created_at'
)
ORDER BY column_name;

-- ========== 2. فحص نوع بيانات images ==========

SELECT 
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name = 'images';

-- ========== 3. فحص جدول stores (للحصول على vendor_id) ==========

SELECT 
  'stores' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stores') as exists;

-- ========== 4. إحصائيات المنتجات ==========

-- عدد المنتجات الكلي
SELECT 
  'Total products' as stat_name,
  COUNT(*) as count
FROM products;

-- عدد المنتجات المفعلة
SELECT 
  'Active products' as stat_name,
  COUNT(*) as count
FROM products
WHERE is_active = true;

-- عدد المنتجات المعطلة
SELECT 
  'Inactive products' as stat_name,
  COUNT(*) as count
FROM products
WHERE is_active = false;

-- ========== 5. اختبار الاستعلامات ==========

-- اختبار جلب المنتجات حسب vendor_id
SELECT 
  'Test: Get products by vendor_id' as test_name,
  EXISTS (
    SELECT 1 FROM products
    WHERE vendor_id IS NOT NULL
    LIMIT 1
  ) as can_execute;

-- اختبار الترتيب حسب تاريخ الإنشاء
SELECT 
  'Test: Order by created_at' as test_name,
  EXISTS (
    SELECT 1 FROM products
    ORDER BY created_at DESC
    LIMIT 1
  ) as can_execute;

-- اختبار تحديث is_active
SELECT 
  'Test: Update is_active' as test_name,
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products'
    AND column_name = 'is_active'
    AND is_updatable = 'YES'
  ) as can_execute;

-- ========== 6. فحص RLS Policies على products ==========

SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'products';

-- عدد السياسات
SELECT 
  'products RLS policies' as table_name,
  COUNT(*) as policies_count
FROM pg_policies
WHERE tablename = 'products';

-- ========== 7. فحص قيم البيانات ==========

-- منتجات بدون صور
SELECT 
  'Products without images' as check_name,
  COUNT(*) as count
FROM products
WHERE images IS NULL OR images = '{}';

-- منتجات بسعر تخفيض
SELECT 
  'Products with sale_price' as check_name,
  COUNT(*) as count
FROM products
WHERE sale_price IS NOT NULL AND sale_price > 0;

-- منتجات بمخزون صفر
SELECT 
  'Products out of stock' as check_name,
  COUNT(*) as count
FROM products
WHERE stock = 0 OR stock IS NULL;

-- ========== 8. الملخص النهائي ==========

SELECT 
  'الأعمدة الأساسية' as category,
  COUNT(CASE WHEN column_name IN (
    'id', 'vendor_id', 'name', 'name_ar', 'description', 'description_ar',
    'price', 'sale_price', 'images', 'is_active', 'stock', 'created_at'
  ) THEN 1 END) as found,
  12 as required
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN (
  'id', 'vendor_id', 'name', 'name_ar', 'description', 'description_ar',
  'price', 'sale_price', 'images', 'is_active', 'stock', 'created_at'
);

-- تم الفحص ✅
