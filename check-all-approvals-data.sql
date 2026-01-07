-- ============================================================================
-- فحص جميع حالات الموافقات والبيانات الموجودة
-- ============================================================================

-- 1. إحصائيات المنتجات حسب حالة الموافقة
SELECT 
  approval_status::text,
  COUNT(*) as count
FROM products
GROUP BY approval_status
ORDER BY count DESC;

-- 2. إحصائيات المتاجر حسب حالة الموافقة
SELECT 
  approval_status::text,
  COUNT(*) as count
FROM stores
GROUP BY approval_status
ORDER BY count DESC;

-- 3. إحصائيات السائقين حسب حالة الموافقة
SELECT 
  approval_status::text,
  COUNT(*) as count
FROM drivers
GROUP BY approval_status
ORDER BY count DESC;

-- 4. عرض جميع المنتجات (أحدث 10)
SELECT 
  id,
  name,
  approval_status::text,
  created_at,
  vendor_id
FROM products
ORDER BY created_at DESC
LIMIT 10;

-- 5. عرض جميع المتاجر (أحدث 10)
SELECT 
  id,
  name,
  name_ar,
  approval_status::text,
  created_at,
  user_id
FROM stores
ORDER BY created_at DESC
LIMIT 10;

-- 6. عرض جميع السائقين (أحدث 10)
SELECT 
  id,
  approval_status::text,
  created_at,
  user_id
FROM drivers
ORDER BY created_at DESC
LIMIT 10;

-- 7. فحص نوع enum لحالة الموافقة
SELECT 
  t.typname AS enum_name,
  e.enumlabel AS enum_value,
  e.enumsortorder AS sort_order
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'approval_status'
ORDER BY e.enumsortorder;
