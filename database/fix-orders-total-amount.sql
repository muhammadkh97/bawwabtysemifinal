-- إصلاح total_amount في جدول orders

-- 1. تحديث جميع الطلبات لحساب total_amount
UPDATE orders
SET total_amount = subtotal + COALESCE(delivery_fee, 0) + COALESCE(tax, 0) - COALESCE(discount, 0),
    updated_at = NOW()
WHERE total_amount IS NULL;

-- 2. تحديث عمود total أيضاً (للتوافق)
UPDATE orders
SET total = subtotal + COALESCE(delivery_fee, 0) + COALESCE(tax, 0) - COALESCE(discount, 0),
    updated_at = NOW()
WHERE total IS NULL OR total = 0;

-- 3. إنشاء trigger لحساب total_amount تلقائياً عند INSERT أو UPDATE
CREATE OR REPLACE FUNCTION calculate_order_total()
RETURNS TRIGGER AS $$
BEGIN
  -- حساب total_amount
  NEW.total_amount = NEW.subtotal + COALESCE(NEW.delivery_fee, 0) + COALESCE(NEW.tax, 0) - COALESCE(NEW.discount, 0);
  
  -- حساب total أيضاً
  NEW.total = NEW.total_amount;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- حذف trigger القديم إذا كان موجوداً
DROP TRIGGER IF EXISTS trigger_calculate_order_total ON orders;

-- إنشاء trigger جديد
CREATE TRIGGER trigger_calculate_order_total
BEFORE INSERT OR UPDATE OF subtotal, delivery_fee, tax, discount ON orders
FOR EACH ROW
EXECUTE FUNCTION calculate_order_total();

-- 4. التحقق من النتائج
SELECT 
  order_number,
  subtotal,
  delivery_fee,
  tax,
  discount,
  total_amount,
  total,
  status
FROM orders
WHERE status = 'delivered'
ORDER BY created_at DESC
LIMIT 10;

-- 5. إحصائيات بعد الإصلاح
SELECT 
  COUNT(*) as total_orders,
  COUNT(total_amount) as orders_with_amount,
  COUNT(*) - COUNT(total_amount) as orders_with_null,
  ROUND(AVG(total_amount), 2) as avg_amount,
  MIN(total_amount) as min_amount,
  MAX(total_amount) as max_amount
FROM orders;
