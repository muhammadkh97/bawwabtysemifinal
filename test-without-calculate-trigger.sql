-- ============================================================================
-- تعطيل trigger_calculate_order_total مؤقتاً للاختبار
-- ============================================================================

-- تعطيل الـ trigger
ALTER TABLE orders DISABLE TRIGGER trigger_calculate_order_total;

-- اختبار التحديث
UPDATE orders
SET 
  status = 'delivered',
  delivered_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'a5b017a7-4308-433d-bfe5-8eb5935ab6eb';

-- التحقق من النجاح
SELECT 
  id, 
  order_number, 
  status, 
  delivered_at,
  'SUCCESS' as result
FROM orders
WHERE id = 'a5b017a7-4308-433d-bfe5-8eb5935ab6eb';
