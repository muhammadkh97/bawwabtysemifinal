-- ============================================
-- فحص صفحة لوحة تحكم المطعم
-- Restaurant Dashboard Page Check
-- ============================================

-- ========== 1. فحص جدول stores ==========

SELECT 
  'stores' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stores') as exists;

-- فحص الأعمدة المطلوبة في stores
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'stores'
AND column_name IN (
  'id', 'user_id', 'shop_name_ar', 'business_type', 'is_online'
)
ORDER BY column_name;

-- ========== 2. فحص جدول orders ==========

SELECT 
  'orders' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') as exists;

-- فحص الأعمدة المطلوبة في orders
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name IN (
  'id', 'vendor_id', 'customer_id', 'total_amount', 'status', 'created_at'
)
ORDER BY column_name;

-- ========== 3. فحص Foreign Key للعملاء ==========

SELECT 
  'orders_customer_id_fkey' as foreign_key_name,
  EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'orders_customer_id_fkey'
    AND table_name = 'orders'
    AND constraint_type = 'FOREIGN KEY'
  ) as exists;

-- ========== 4. فحص جدول products ==========

SELECT 
  'products' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') as exists;

-- ========== 5. فحص جدول reviews ==========

SELECT 
  'reviews' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reviews') as exists;

-- فحص أعمدة reviews
SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'reviews'
AND column_name IN ('vendor_id', 'rating')
ORDER BY column_name;

-- ========== 6. إحصائيات البيانات ==========

-- عدد المطاعم
SELECT 
  'stores (restaurants)' as table_name,
  COUNT(*) as count
FROM stores
WHERE business_type = 'restaurant';

-- عدد الطلبات
SELECT 
  'orders' as table_name,
  COUNT(*) as count
FROM orders;

-- عدد المنتجات
SELECT 
  'products' as table_name,
  COUNT(*) as count
FROM products;

-- عدد التقييمات
SELECT 
  'reviews' as table_name,
  COUNT(*) as count
FROM reviews;

-- ========== 7. اختبار الاستعلامات الأساسية ==========

-- اختبار جلب معلومات المطعم (يحتاج user_id حقيقي)
SELECT 
  'Test: Get restaurant by user_id' as test_name,
  EXISTS (
    SELECT 1 FROM stores 
    WHERE business_type = 'restaurant' 
    LIMIT 1
  ) as can_execute;

-- اختبار جلب الطلبات بالعلاقة مع users
SELECT 
  'Test: Get orders with customer info' as test_name,
  EXISTS (
    SELECT 1 
    FROM orders o
    LEFT JOIN users u ON o.customer_id = u.id
    LIMIT 1
  ) as can_execute;

-- اختبار حساب الإحصائيات
SELECT 
  'Test: Calculate stats' as test_name,
  EXISTS (
    SELECT 
      COUNT(*) as total_orders,
      SUM(total_amount) as total_revenue
    FROM orders
    WHERE vendor_id IS NOT NULL
    LIMIT 1
  ) as can_execute;

-- ========== 8. فحص قيم business_type ==========

SELECT DISTINCT business_type 
FROM stores;

-- ========== 9. فحص قيم status في orders ==========

SELECT DISTINCT status 
FROM orders;

-- ========== 10. الملخص النهائي ==========

SELECT 
  'الجداول الأساسية' as category,
  COUNT(CASE WHEN table_name IN ('stores', 'orders', 'products', 'reviews', 'users') THEN 1 END) as found,
  5 as required
FROM information_schema.tables
WHERE table_name IN ('stores', 'orders', 'products', 'reviews', 'users');

-- تم الفحص ✅
