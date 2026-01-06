-- ============================================
-- فحص صفحة الإحصائيات - المطعم
-- Restaurant Analytics Page Check
-- ============================================

-- ========== 1. فحص جدول orders ==========

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
AND column_name IN ('id', 'vendor_id', 'total_amount', 'created_at')
ORDER BY column_name;

-- ========== 2. فحص جدول order_items ==========

SELECT 
  'order_items' as table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') as exists;

-- فحص الأعمدة المطلوبة في order_items
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'order_items'
AND column_name IN ('order_id', 'product_id', 'product_name', 'quantity', 'price')
ORDER BY column_name;

-- ========== 3. فحص جدول products ==========

SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN ('id', 'vendor_id', 'name')
ORDER BY column_name;

-- ========== 4. فحص جدول reviews ==========

SELECT 
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'reviews'
AND column_name IN ('vendor_id', 'rating')
ORDER BY column_name;

-- ========== 5. اختبار الاستعلامات ==========

-- اختبار جلب orders مع order_items
SELECT 
  'Test: Get orders with items' as test_name,
  EXISTS (
    SELECT 1 
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LIMIT 1
  ) as can_execute;

-- اختبار حساب الإيرادات
SELECT 
  'Test: Calculate revenue' as test_name,
  EXISTS (
    SELECT SUM(total_amount) as total_revenue
    FROM orders
    WHERE vendor_id IS NOT NULL
    LIMIT 1
  ) as can_execute;

-- اختبار حساب متوسط التقييم
SELECT 
  'Test: Calculate average rating' as test_name,
  EXISTS (
    SELECT AVG(rating) as avg_rating
    FROM reviews
    WHERE vendor_id IS NOT NULL
    LIMIT 1
  ) as can_execute;

-- ========== 6. إحصائيات البيانات ==========

-- عدد الطلبات
SELECT 
  'Total orders' as stat_name,
  COUNT(*) as count
FROM orders;

-- عدد order_items
SELECT 
  'Total order items' as stat_name,
  COUNT(*) as count
FROM order_items;

-- عدد المنتجات
SELECT 
  'Total products' as stat_name,
  COUNT(*) as count
FROM products;

-- عدد التقييمات
SELECT 
  'Total reviews' as stat_name,
  COUNT(*) as count
FROM reviews;

-- ========== 7. اختبار حساب أفضل المنتجات ==========

SELECT 
  'Test: Top products calculation' as test_name,
  EXISTS (
    SELECT 
      oi.product_id,
      oi.product_name,
      SUM(oi.quantity) as sales,
      SUM(oi.price * oi.quantity) as revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE o.vendor_id IS NOT NULL
    GROUP BY oi.product_id, oi.product_name
    ORDER BY revenue DESC
    LIMIT 1
  ) as can_execute;

-- ========== 8. الملخص النهائي ==========

SELECT 
  'الجداول المطلوبة' as category,
  COUNT(CASE WHEN table_name IN ('orders', 'order_items', 'products', 'reviews') THEN 1 END) as found,
  4 as required
FROM information_schema.tables
WHERE table_name IN ('orders', 'order_items', 'products', 'reviews');

-- تم الفحص ✅
