-- ============================================
-- فحص عمود items في جدول orders
-- ============================================

-- 1. فحص نوع البيانات والقيود على عمود items
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  udt_name
FROM information_schema.columns
WHERE table_name = 'orders' 
  AND column_name = 'items';

-- 2. فحص جميع الأعمدة في جدول orders
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'orders'
ORDER BY ordinal_position;

-- 3. فحص نموذج من البيانات الموجودة
SELECT 
  id,
  order_number,
  items,
  subtotal,
  total
FROM orders
LIMIT 3;
