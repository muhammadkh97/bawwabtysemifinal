-- ====================================
-- فحص صفحة Reports (التقارير والتحليلات)
-- ====================================

-- ========== 1. فحص الجداول المستخدمة ==========

-- 1.1 فحص جدول orders
SELECT 
  'orders table' as check_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') as table_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'orders') as column_count;

-- عرض أعمدة orders المهمة للتقارير
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('id', 'total_amount', 'status', 'vendor_id', 'customer_id', 'created_at', 'delivery_fee', 'tax', 'discount')
ORDER BY ordinal_position;

-- 1.2 فحص جدول commissions
SELECT 
  'commissions table' as check_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commissions') as table_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'commissions') as column_count;

-- عرض أعمدة commissions
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'commissions'
ORDER BY ordinal_position;

-- ========== 2. فحص البيانات - تقرير المبيعات ==========

-- 2.1 إجمالي المبيعات (الطلبات المكتملة)
SELECT 
  COUNT(*) as total_orders,
  COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
  SUM(CASE WHEN status = 'delivered' AND total_amount IS NOT NULL THEN total_amount ELSE 0 END) as total_sales,
  AVG(CASE WHEN status = 'delivered' AND total_amount IS NOT NULL THEN total_amount ELSE 0 END) as avg_order_value
FROM orders;

-- 2.2 المبيعات الشهرية (آخر 12 شهر)
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as orders_count,
  SUM(CASE WHEN total_amount IS NOT NULL THEN total_amount ELSE 0 END) as monthly_sales
FROM orders
WHERE status = 'delivered'
  AND created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC
LIMIT 12;

-- 2.3 المبيعات اليومية (آخر 7 أيام)
SELECT 
  DATE(created_at) as day,
  COUNT(*) as orders_count,
  SUM(CASE WHEN total_amount IS NOT NULL THEN total_amount ELSE 0 END) as daily_sales
FROM orders
WHERE status = 'delivered'
  AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY day DESC;

-- ========== 3. تقرير الطلبات حسب الحالة ==========

SELECT 
  status,
  COUNT(*) as count,
  SUM(CASE WHEN total_amount IS NOT NULL THEN total_amount ELSE 0 END) as total_amount
FROM orders
GROUP BY status
ORDER BY count DESC;

-- ========== 4. تقرير البائعين ==========

-- 4.1 أفضل البائعين (حسب عدد الطلبات)
SELECT 
  o.vendor_id,
  s.name as store_name,
  s.name_ar as store_name_ar,
  COUNT(*) as total_orders,
  COUNT(CASE WHEN o.status = 'delivered' THEN 1 END) as delivered_orders,
  SUM(CASE WHEN o.status = 'delivered' AND o.total_amount IS NOT NULL THEN o.total_amount ELSE 0 END) as total_sales
FROM orders o
LEFT JOIN stores s ON o.vendor_id = s.id
GROUP BY o.vendor_id, s.name, s.name_ar
ORDER BY total_sales DESC
LIMIT 10;

-- ========== 5. تقرير العملاء ==========

-- 5.1 أفضل العملاء (حسب عدد الطلبات)
SELECT 
  o.customer_id,
  u.name as customer_name,
  u.full_name,
  u.email,
  COUNT(*) as total_orders,
  SUM(CASE WHEN o.status = 'delivered' AND o.total_amount IS NOT NULL THEN o.total_amount ELSE 0 END) as total_spent
FROM orders o
LEFT JOIN users u ON o.customer_id = u.id
GROUP BY o.customer_id, u.name, u.full_name, u.email
ORDER BY total_spent DESC
LIMIT 10;

-- ========== 6. تقرير العمولات ==========

-- 6.1 إجمالي العمولات
SELECT 
  COUNT(*) as total_commissions,
  SUM(CASE WHEN amount IS NOT NULL THEN amount ELSE 0 END) as total_amount,
  AVG(CASE WHEN amount IS NOT NULL THEN amount ELSE 0 END) as avg_commission
FROM commissions;

-- 6.2 العمولات حسب الحالة
SELECT 
  status,
  COUNT(*) as count,
  SUM(CASE WHEN amount IS NOT NULL THEN amount ELSE 0 END) as total_amount
FROM commissions
GROUP BY status
ORDER BY count DESC;

-- 6.3 العمولات الشهرية
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as commissions_count,
  SUM(CASE WHEN amount IS NOT NULL THEN amount ELSE 0 END) as monthly_commissions
FROM commissions
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC
LIMIT 12;

-- ========== 7. التقرير المالي الشامل ==========

SELECT 
  'Financial Summary' as report_name,
  json_build_object(
    'total_revenue', (
      SELECT COALESCE(SUM(total_amount), 0) 
      FROM orders 
      WHERE status = 'delivered' AND total_amount IS NOT NULL
    ),
    'total_orders', (
      SELECT COUNT(*) 
      FROM orders 
      WHERE status = 'delivered'
    ),
    'total_commissions', (
      SELECT COALESCE(SUM(amount), 0) 
      FROM commissions 
      WHERE amount IS NOT NULL
    ),
    'pending_commissions', (
      SELECT COALESCE(SUM(amount), 0) 
      FROM commissions 
      WHERE status = 'pending' AND amount IS NOT NULL
    ),
    'paid_commissions', (
      SELECT COALESCE(SUM(amount), 0) 
      FROM commissions 
      WHERE status = 'paid' AND amount IS NOT NULL
    ),
    'avg_order_value', (
      SELECT COALESCE(AVG(total_amount), 0) 
      FROM orders 
      WHERE status = 'delivered' AND total_amount IS NOT NULL
    )
  ) as summary;

-- ========== 8. التحقق من الحقول المطلوبة ==========

SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total_amount') THEN 'total_amount ✅'
    ELSE 'total_amount ❌'
  END as total_amount_check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'status') THEN 'status ✅'
    ELSE 'status ❌'
  END as status_check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'vendor_id') THEN 'vendor_id ✅'
    ELSE 'vendor_id ❌'
  END as vendor_id_check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'customer_id') THEN 'customer_id ✅'
    ELSE 'customer_id ❌'
  END as customer_id_check;

-- ========== 9. ملخص النتائج ==========

SELECT 
  'Reports Summary' as section,
  json_build_object(
    'orders_table_exists', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders'),
    'commissions_table_exists', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commissions'),
    'total_orders', (SELECT COUNT(*) FROM orders),
    'delivered_orders', (SELECT COUNT(*) FROM orders WHERE status = 'delivered'),
    'total_revenue', (
      SELECT COALESCE(SUM(total_amount), 0) 
      FROM orders 
      WHERE status = 'delivered' AND total_amount IS NOT NULL
    ),
    'total_commissions_records', (SELECT COUNT(*) FROM commissions),
    'commissions_amount', (SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE amount IS NOT NULL)
  ) as summary;
