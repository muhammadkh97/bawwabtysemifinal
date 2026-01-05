-- ============================================
-- فحص شامل للوحة تحكم المدير الرئيسية
-- ============================================

-- ========== 1. فحص RPC Function ==========

SELECT 
  'get_admin_dashboard_stats RPC' as check_name,
  EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_admin_dashboard_stats'
  ) as function_exists;

-- ========== 2. إحصائيات من public.users ==========

-- 2.1 إجمالي المستخدمين
SELECT 
  'إجمالي المستخدمين' as stat_name,
  COUNT(*) as value
FROM users;

-- 2.2 المستخدمين حسب الدور
SELECT 
  COALESCE(role::text, 'customer') as role,
  COUNT(*) as count
FROM users
GROUP BY role
ORDER BY count DESC;

-- ========== 3. إحصائيات الطلبات ==========

-- 3.1 إجمالي الطلبات
SELECT 
  'إجمالي الطلبات' as stat_name,
  COUNT(*) as value
FROM orders;

-- 3.2 إجمالي المبيعات (delivered فقط)
SELECT 
  'إجمالي المبيعات' as stat_name,
  COALESCE(SUM(total_amount), 0) as value
FROM orders
WHERE status = 'delivered';

-- 3.3 متوسط قيمة الطلب
SELECT 
  'متوسط قيمة الطلب' as stat_name,
  COALESCE(AVG(total_amount), 0) as value
FROM orders
WHERE status = 'delivered' AND total_amount IS NOT NULL;

-- ========== 4. Quick Stats المطلوبة ==========

SELECT 
  json_build_object(
    'تجار_نشطين', (SELECT COUNT(*) FROM users WHERE role = 'vendor'),
    'مطاعم', (SELECT COUNT(*) FROM users WHERE role = 'restaurant'),
    'سائقين', (SELECT COUNT(*) FROM users WHERE role = 'driver'),
    'عملاء', (SELECT COUNT(*) FROM users WHERE role = 'customer')
  ) as quick_stats;

-- ========== 5. المستخدمون الجدد (آخر 4) ==========

SELECT 
  id,
  COALESCE(name, full_name) as name,
  email,
  COALESCE(phone, 'غير محدد') as phone,
  role,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 4;

-- ========== 6. أفضل المنتجات (Top 4) ==========

SELECT 
  p.id,
  p.name,
  p.price,
  p.stock,
  COALESCE(SUM(oi.quantity), 0) as total_sales,
  COALESCE(SUM(oi.item_total), 0) as total_revenue
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
GROUP BY p.id, p.name, p.price, p.stock
ORDER BY total_sales DESC
LIMIT 4;

-- ========== 7. ملخص شامل للوحة التحكم ==========

SELECT 
  'Dashboard Summary' as report_name,
  json_build_object(
    'total_users', (SELECT COUNT(*) FROM users),
    'total_orders', (SELECT COUNT(*) FROM orders),
    'total_revenue', (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'delivered'),
    'avg_order_value', (SELECT COALESCE(AVG(total_amount), 0) FROM orders WHERE status = 'delivered'),
    'total_vendors', (SELECT COUNT(*) FROM users WHERE role = 'vendor'),
    'total_restaurants', (SELECT COUNT(*) FROM users WHERE role = 'restaurant'),
    'total_drivers', (SELECT COUNT(*) FROM users WHERE role = 'driver'),
    'total_customers', (SELECT COUNT(*) FROM users WHERE role = 'customer'),
    'total_products', (SELECT COUNT(*) FROM products),
    'total_stores', (SELECT COUNT(*) FROM stores),
    'pending_orders', (SELECT COUNT(*) FROM orders WHERE status = 'pending'),
    'delivered_orders', (SELECT COUNT(*) FROM orders WHERE status = 'delivered')
  ) as summary;
FROM drivers
UNION ALL
SELECT 
  'سائقين متاحين' AS النوع,
  COUNT(*) AS العدد
FROM drivers
WHERE is_available = true;

-- 6. الإيرادات اليومية
SELECT 
  DATE(created_at) AS التاريخ,
  COUNT(*) AS عدد_الطلبات,
  SUM(total) AS الإيرادات,
  SUM(delivery_fee) AS رسوم_التوصيل
FROM orders
WHERE status IN ('delivered', 'completed')
  AND created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY التاريخ DESC;

-- 7. أحدث الطلبات (آخر 10)
SELECT 
  o.order_number AS رقم_الطلب,
  o.status AS الحالة,
  o.total AS المبلغ,
  o.created_at AS التاريخ,
  u.raw_user_meta_data->>'name' AS العميل,
  s.name AS المتجر
FROM orders o
LEFT JOIN auth.users u ON o.customer_id = u.id
LEFT JOIN stores s ON o.vendor_id = s.id
ORDER BY o.created_at DESC
LIMIT 10;

-- 8. فحص جدول المحافظ (wallets)
SELECT 
  'هل جدول wallets موجود؟' AS السؤال,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'wallets'
    ) THEN '✅ موجود'
    ELSE '❌ غير موجود'
  END AS الإجابة;

-- 9. إحصائيات المحافظ إن وجدت
SELECT 
  COUNT(*) AS عدد_المحافظ,
  SUM(balance) AS إجمالي_الأرصدة,
  AVG(balance) AS متوسط_الرصيد
FROM wallets;

-- 10. فحص العلاقات الأساسية
SELECT 
  '✅ تم فحص جميع الإحصائيات' AS الحالة,
  'راجع النتائج أعلاه' AS الرسالة;
