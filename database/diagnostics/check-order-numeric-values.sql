-- ============================================================================
-- فحص بيانات الطلب لمعرفة سبب numeric overflow
-- ============================================================================

-- 1. فحص جميع القيم الرقمية للطلب
SELECT 
  id,
  order_number,
  status,
  subtotal,
  delivery_fee,
  tax,
  discount,
  total,
  total_amount,
  -- التحقق من حجم الأرقام
  LENGTH(subtotal::TEXT) as subtotal_length,
  LENGTH(delivery_fee::TEXT) as delivery_fee_length,
  LENGTH(total::TEXT) as total_length,
  -- التحقق من القيم العشرية
  SCALE(subtotal) as subtotal_scale,
  SCALE(delivery_fee) as delivery_fee_scale,
  SCALE(total) as total_scale
FROM orders
WHERE id = 'a5b017a7-4308-433d-bfe5-8eb5935ab6eb';

-- 2. فحص نوع البيانات لكل عمود رقمي
SELECT 
  column_name,
  data_type,
  numeric_precision,
  numeric_scale
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('subtotal', 'delivery_fee', 'tax', 'discount', 'total', 'total_amount')
ORDER BY ordinal_position;

-- 3. محاولة حساب يدوي للتحقق
SELECT 
  subtotal,
  COALESCE(delivery_fee, 0) as delivery_fee,
  COALESCE(tax, 0) as tax,
  COALESCE(discount, 0) as discount,
  -- المحاولة الحسابية
  subtotal + COALESCE(delivery_fee, 0) + COALESCE(tax, 0) - COALESCE(discount, 0) as calculated_total
FROM orders
WHERE id = 'a5b017a7-4308-433d-bfe5-8eb5935ab6eb';
