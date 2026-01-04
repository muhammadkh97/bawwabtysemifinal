-- ============================================
-- فحص بنية جدول orders
-- ============================================

-- عرض جميع الأعمدة في جدول orders
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'orders'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- التحقق من وجود الأعمدة المطلوبة
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'coupon_discount') 
    THEN '✅ coupon_discount موجود' 
    ELSE '❌ coupon_discount غير موجود' 
  END as coupon_discount_status,
  
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'discount') 
    THEN '✅ discount موجود' 
    ELSE '❌ discount غير موجود' 
  END as discount_status,
  
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'coupon_id') 
    THEN '✅ coupon_id موجود' 
    ELSE '❌ coupon_id غير موجود' 
  END as coupon_id_status;
