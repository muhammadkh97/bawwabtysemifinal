-- ============================================================================
-- تعطيل triggers المشكلة مؤقتاً
-- ============================================================================

-- تعطيل الـ triggers المسببة للمشاكل
ALTER TABLE orders DISABLE TRIGGER trigger_calculate_order_total;
ALTER TABLE orders DISABLE TRIGGER trigger_calculate_commission;
ALTER TABLE orders DISABLE TRIGGER trigger_update_vendor_wallet;
ALTER TABLE orders DISABLE TRIGGER trigger_update_batch_totals;

-- اختبار التحديث
UPDATE orders
SET 
  status = 'delivered',
  delivered_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'a5b017a7-4308-433d-bfe5-8eb5935ab6eb';

-- التحقق من النجاح
SELECT id, order_number, status, delivered_at
FROM orders
WHERE id = 'a5b017a7-4308-433d-bfe5-8eb5935ab6eb';

-- إعادة تفعيل triggers (بعد التأكد من النجاح)
-- ALTER TABLE orders ENABLE TRIGGER trigger_calculate_order_total;
-- ALTER TABLE orders ENABLE TRIGGER trigger_calculate_commission;
-- ALTER TABLE orders ENABLE TRIGGER trigger_update_vendor_wallet;
-- ALTER TABLE orders ENABLE TRIGGER trigger_update_batch_totals;
