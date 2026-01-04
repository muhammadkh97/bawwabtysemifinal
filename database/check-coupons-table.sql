-- ============================================
-- فحص جدول الكوبونات
-- ============================================

-- التحقق من وجود جدول coupons
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'coupons') 
    THEN '✅ جدول coupons موجود' 
    ELSE '❌ جدول coupons غير موجود' 
  END as table_status;

-- عرض بنية جدول coupons (إذا كان موجوداً)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'coupons'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- عرض 5 كوبونات كأمثلة
SELECT 
  id,
  code,
  discount_type,
  discount_value,
  is_active,
  usage_limit,
  used_count
FROM coupons
LIMIT 5;
