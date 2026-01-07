-- ============================================================================
-- فحص شامل لجميع triggers على جدول orders لتحديد مصدر numeric overflow
-- ============================================================================

-- 1. قائمة جميع الـ triggers النشطة على جدول orders
SELECT 
  t.trigger_name,
  t.event_manipulation,
  t.action_timing,
  t.action_orientation,
  t.action_statement,
  p.proname as function_name,
  CASE 
    WHEN t.tgenabled = 'O' THEN 'ENABLED'
    WHEN t.tgenabled = 'D' THEN 'DISABLED'
    ELSE 'OTHER'
  END as trigger_status
FROM information_schema.triggers t
LEFT JOIN pg_trigger pgt ON pgt.tgname = t.trigger_name
LEFT JOIN pg_proc p ON p.oid = pgt.tgfoid
WHERE t.event_object_table = 'orders'
ORDER BY t.action_timing, t.trigger_name;

-- 2. فحص تفصيلي لدالة calculate_order_total
SELECT 
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS full_definition
FROM pg_proc p
WHERE p.proname = 'calculate_order_total';

-- 3. فحص التفاصيل الدقيقة لعمود total_amount
SELECT 
  column_name,
  data_type,
  numeric_precision,
  numeric_precision_radix,
  numeric_scale,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('subtotal', 'delivery_fee', 'tax', 'discount', 'total', 'total_amount')
ORDER BY ordinal_position;

-- 4. محاولة حساب يدوي على الطلب المحدد
SELECT 
  id,
  order_number,
  subtotal,
  delivery_fee,
  tax,
  discount,
  total,
  total_amount,
  -- محاولة الحساب اليدوي
  (subtotal + COALESCE(delivery_fee, 0) + COALESCE(tax, 0) - COALESCE(discount, 0))::numeric(10,2) as calculated_value,
  -- فحص الأعداد الكبيرة جداً
  CASE WHEN subtotal > 99999999 THEN 'OVERFLOW' ELSE 'OK' END as subtotal_check,
  CASE WHEN total > 99999999 THEN 'OVERFLOW' ELSE 'OK' END as total_check
FROM orders
WHERE id = 'a5b017a7-4308-433d-bfe5-8eb5935ab6eb';

-- 5. فحص إذا كانت هناك قيود CHECK على الأعمدة الرقمية
SELECT
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'orders'
  AND con.contype = 'c'
  AND pg_get_constraintdef(con.oid) LIKE '%total%';

-- 6. فحص جميع الـ BEFORE triggers على orders
SELECT 
  t.trigger_name,
  t.event_manipulation,
  p.proname as function_name
FROM information_schema.triggers t
LEFT JOIN pg_trigger pgt ON pgt.tgname = t.trigger_name
LEFT JOIN pg_proc p ON p.oid = pgt.tgfoid
WHERE t.event_object_table = 'orders'
  AND t.action_timing = 'BEFORE'
ORDER BY t.trigger_name;
