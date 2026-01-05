-- ====================================
-- فحص قسم إجمالي المبيعات
-- ====================================

-- ========== 1. فحص RPC Function ==========

SELECT * FROM get_admin_dashboard_stats();

-- ========== 2. فحص الطلبات المكتملة ==========

SELECT 
  COUNT(*) as delivered_orders,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_order_value
FROM orders
WHERE status = 'delivered'
  AND total_amount IS NOT NULL;

-- ========== 3. عرض الطلبات المكتملة ==========

SELECT 
  id,
  order_number,
  status,
  total_amount,
  created_at
FROM orders
WHERE status = 'delivered'
ORDER BY created_at DESC;

-- ========== 4. فحص جميع الطلبات ==========

SELECT 
  status,
  COUNT(*) as count,
  SUM(total_amount) as total,
  AVG(total_amount) as avg
FROM orders
GROUP BY status
ORDER BY count DESC;

-- ========== 5. التحقق من total_amount ==========

SELECT 
  'Orders with NULL total_amount' as check_name,
  COUNT(*) as count
FROM orders
WHERE total_amount IS NULL;
