-- فحص مشكلة total_amount = null في جدول orders

-- 1. فحص جميع الطلبات المكتملة
SELECT 
  id,
  order_number,
  total_amount,
  subtotal,
  delivery_fee,
  tax,
  discount,
  status,
  created_at
FROM orders
WHERE status = 'delivered'
ORDER BY created_at DESC
LIMIT 10;

-- 2. فحص أعمدة orders المتعلقة بالمبالغ
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('total_amount', 'subtotal', 'delivery_fee', 'tax', 'discount', 'total')
ORDER BY ordinal_position;

-- 3. إحصائيات total_amount
SELECT 
  COUNT(*) as total_orders,
  COUNT(total_amount) as orders_with_amount,
  COUNT(*) - COUNT(total_amount) as orders_with_null,
  ROUND(AVG(total_amount), 2) as avg_amount,
  MIN(total_amount) as min_amount,
  MAX(total_amount) as max_amount
FROM orders
WHERE status = 'delivered';

-- 4. فحص order_items لحساب total_amount
SELECT 
  o.id,
  o.order_number,
  o.total_amount,
  COUNT(oi.id) as items_count,
  COALESCE(SUM(oi.price * oi.quantity), 0) as calculated_subtotal
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.status = 'delivered'
GROUP BY o.id, o.order_number, o.total_amount
ORDER BY o.created_at DESC
LIMIT 10;

-- 5. تحديد اسم العمود الصحيح
SELECT 
  'Column names in orders table:' as info,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name LIKE '%total%' OR column_name LIKE '%amount%';
