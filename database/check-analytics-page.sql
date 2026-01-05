-- ====================================
-- فحص عميق لصفحة Analytics (التحليلات)
-- ====================================

-- 1. فحص جدول users للإحصائيات
SELECT 
  'users table' as check_name,
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'customer' THEN 1 END) as customers,
  COUNT(CASE WHEN role = 'vendor' THEN 1 END) as vendors,
  COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as new_users_week
FROM users;

-- 2. فحص orders للإيرادات ومعدل التحويل
SELECT 
  COUNT(*) as total_orders,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
  ROUND(COUNT(CASE WHEN status = 'delivered' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC * 100, 2) as conversion_rate_percent,
  SUM(CASE WHEN status = 'delivered' THEN total_amount ELSE 0 END) as total_revenue,
  ROUND(AVG(CASE WHEN status = 'delivered' THEN total_amount END), 2) as avg_order_value
FROM orders;

-- 3. فحص reviews للتقييمات
SELECT 
  'reviews table' as check_name,
  COUNT(*) as total_reviews,
  ROUND(AVG(rating), 2) as avg_rating,
  COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_reviews,
  COUNT(CASE WHEN rating <= 2 THEN 1 END) as negative_reviews
FROM reviews;

-- 4. فحص order_items لأكثر المنتجات مبيعاً
SELECT 
  oi.product_id,
  p.name_ar,
  p.name,
  COUNT(oi.id) as order_count,
  SUM(oi.quantity) as total_quantity_sold,
  SUM(oi.price * oi.quantity) as total_revenue
FROM order_items oi
LEFT JOIN products p ON oi.product_id = p.id
GROUP BY oi.product_id, p.name_ar, p.name
ORDER BY total_quantity_sold DESC
LIMIT 5;

-- 5. فحص النشاط الأخير - الطلبات
SELECT 
  id,
  order_number,
  status,
  total_amount,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;

-- 6. فحص النشاط الأخير - المستخدمين الجدد
SELECT 
  id,
  name,
  email,
  role,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 5;

-- 7. فحص النشاط الأخير - التقييمات
SELECT 
  r.id,
  r.rating,
  r.comment,
  r.created_at,
  p.name_ar as product_name
FROM reviews r
LEFT JOIN products p ON r.product_id = p.id
ORDER BY r.created_at DESC
LIMIT 5;

-- 8. إحصائيات الإيرادات الشهرية
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as orders_count,
  SUM(total_amount) as monthly_revenue
FROM orders
WHERE status = 'delivered'
  AND created_at >= NOW() - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- 9. التحقق من foreign keys في order_items
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
WHERE tc.table_name = 'order_items'
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'product_id';

-- 10. ملخص شامل
SELECT 
  'Analytics Summary' as section,
  json_build_object(
    'total_users', (SELECT COUNT(*) FROM users),
    'total_orders', (SELECT COUNT(*) FROM orders),
    'total_revenue', (SELECT SUM(total_amount) FROM orders WHERE status = 'delivered'),
    'avg_rating', (SELECT ROUND(AVG(rating), 2) FROM reviews),
    'conversion_rate', (
      SELECT ROUND(
        COUNT(CASE WHEN status = 'delivered' THEN 1 END)::NUMERIC / 
        NULLIF(COUNT(*)::NUMERIC, 0) * 100, 
        2
      ) FROM orders
    )
  ) as summary;
