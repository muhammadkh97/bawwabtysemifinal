-- ====================================
-- فحص حالة الطلبات في قاعدة البيانات
-- ====================================

-- 1. فحص جميع القيم الممكنة لـ status
SELECT 
  status,
  COUNT(*) as count,
  SUM(total_amount) as total_amount_sum
FROM orders
GROUP BY status
ORDER BY count DESC;

-- 2. فحص الطلبات التي status = 'delivered' بالضبط
SELECT 
  order_number,
  status,
  total_amount,
  created_at
FROM orders
WHERE status = 'delivered'
ORDER BY created_at DESC;

-- 3. فحص إذا كان هناك مسافات أو أحرف خاصة في status
SELECT 
  order_number,
  status,
  LENGTH(status) as status_length,
  total_amount,
  status = 'delivered' as is_exactly_delivered,
  TRIM(status) = 'delivered' as is_delivered_after_trim
FROM orders
LIMIT 20;

-- 4. اختبار الـ query الموجود في RPC
SELECT 
  COALESCE(SUM(total_amount::DOUBLE PRECISION), 0) as total_revenue,
  COALESCE(AVG(total_amount::DOUBLE PRECISION), 0) as avg_order_value,
  COUNT(*) as delivered_count
FROM orders 
WHERE status = 'delivered';

-- 5. تجربة مع ILIKE (case-insensitive)
SELECT 
  COALESCE(SUM(total_amount::DOUBLE PRECISION), 0) as total_revenue,
  COALESCE(AVG(total_amount::DOUBLE PRECISION), 0) as avg_order_value,
  COUNT(*) as delivered_count
FROM orders 
WHERE status ILIKE 'delivered';
