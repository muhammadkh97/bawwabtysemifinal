-- ============================================
-- فحص لوحة تحكم السائق - Driver Dashboard Check
-- ============================================

-- ========================================
-- 1. التحقق من جدول drivers
-- ========================================

SELECT 
  '1. جدول drivers' as check_name,
  EXISTS (SELECT FROM pg_tables WHERE tablename = 'drivers') as table_exists;

-- التحقق من الأعمدة المطلوبة في جدول drivers
SELECT 
  '1.1 أعمدة drivers المطلوبة' as check_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'drivers'
AND column_name IN (
  'id',
  'user_id',
  'is_available',
  'current_location',
  'latitude',
  'longitude',
  'updated_at',
  'created_at',
  'total_distance',
  'today_distance',
  'status'
)
ORDER BY 
  CASE column_name
    WHEN 'id' THEN 1
    WHEN 'user_id' THEN 2
    WHEN 'is_available' THEN 3
    WHEN 'current_location' THEN 4
    WHEN 'latitude' THEN 5
    WHEN 'longitude' THEN 6
    WHEN 'status' THEN 7
    WHEN 'total_distance' THEN 8
    WHEN 'today_distance' THEN 9
    WHEN 'created_at' THEN 10
    WHEN 'updated_at' THEN 11
  END;

-- ========================================
-- 2. التحقق من جدول orders (صفحة الرئيسية)
-- Dashboard Page Requirements:
-- - orders.driver_id
-- - orders.status
-- - orders.delivery_fee
-- - orders.total
-- - orders.order_number
-- - orders.delivery_address
-- - orders.created_at
-- - orders.customer_id (FK to users)
-- - orders.vendor_id (FK to stores)
-- ========================================

SELECT 
  '2. أعمدة orders المطلوبة للرئيسية' as check_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
AND column_name IN (
  'id',
  'driver_id',
  'customer_id',
  'vendor_id',
  'status',
  'delivery_fee',
  'total',
  'total_amount',
  'order_number',
  'delivery_address',
  'delivery_latitude',
  'delivery_longitude',
  'created_at'
)
ORDER BY 
  CASE column_name
    WHEN 'id' THEN 1
    WHEN 'driver_id' THEN 2
    WHEN 'customer_id' THEN 3
    WHEN 'vendor_id' THEN 4
    WHEN 'status' THEN 5
    WHEN 'order_number' THEN 6
    WHEN 'total' THEN 7
    WHEN 'total_amount' THEN 8
    WHEN 'delivery_fee' THEN 9
    WHEN 'delivery_address' THEN 10
    WHEN 'delivery_latitude' THEN 11
    WHEN 'delivery_longitude' THEN 12
    WHEN 'created_at' THEN 13
  END;

-- ========================================
-- 3. التحقق من جدول users (لبيانات العملاء)
-- Required for customer data:
-- - users.id
-- - users.name (or full_name)
-- - users.phone
-- ========================================

SELECT 
  '3. أعمدة users للعملاء' as check_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN (
  'id',
  'name',
  'full_name',
  'phone',
  'email'
)
ORDER BY column_name;

-- ========================================
-- 4. التحقق من جدول stores (لبيانات المتاجر/المطاعم)
-- Required for vendor data:
-- - stores.id
-- - stores.name
-- - stores.latitude
-- - stores.longitude
-- - stores.address
-- ========================================

SELECT 
  '4. أعمدة stores للمتاجر' as check_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'stores'
AND column_name IN (
  'id',
  'name',
  'shop_name',
  'shop_name_ar',
  'latitude',
  'longitude',
  'address',
  'store_address'
)
ORDER BY column_name;

-- ========================================
-- 5. التحقق من Foreign Keys
-- ========================================

SELECT 
  '5. Foreign Keys للطلبات' as check_name,
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'orders'
AND kcu.column_name IN ('driver_id', 'customer_id', 'vendor_id');

-- ========================================
-- 6. فحص قيم status المسموحة
-- ========================================

SELECT 
  '6. حالات الطلبات المستخدمة' as check_name,
  status,
  COUNT(*) as count
FROM orders
GROUP BY status
ORDER BY count DESC;

-- ========================================
-- 7. التحقق من RLS Policies لجدول drivers
-- ========================================

SELECT 
  '7. RLS Policies - drivers' as check_name,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'drivers'
ORDER BY policyname;

-- ========================================
-- 8. التحقق من RLS Policies لجدول orders للسائق
-- ========================================

SELECT 
  '8. RLS Policies - orders (driver)' as check_name,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'orders'
AND (
  policyname ILIKE '%driver%' 
  OR qual::text ILIKE '%driver%'
)
ORDER BY policyname;

-- ========================================
-- 9. اختبار البيانات - هل يوجد سائقين؟
-- ========================================

SELECT 
  '9. عدد السائقين المسجلين' as check_name,
  COUNT(*) as total_drivers,
  COUNT(*) FILTER (WHERE is_available = true) as available_drivers,
  COUNT(*) FILTER (WHERE is_available = false) as unavailable_drivers
FROM drivers;

-- ========================================
-- 10. اختبار البيانات - طلبات السائقين
-- ========================================

SELECT 
  '10. طلبات السائقين حسب الحالة' as check_name,
  status,
  COUNT(*) as order_count,
  SUM(delivery_fee) as total_fees
FROM orders
WHERE driver_id IS NOT NULL
GROUP BY status
ORDER BY order_count DESC;

-- ========================================
-- 11. فحص الأعمدة المفقودة المحتملة
-- ========================================

-- التحقق من وجود total أو total_amount في orders
SELECT 
  '11. تحقق من total vs total_amount' as check_name,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total') as has_total,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total_amount') as has_total_amount;

-- التحقق من وجود name أو full_name في users
SELECT 
  '11.1 تحقق من name vs full_name' as check_name,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'name') as has_name,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'full_name') as has_full_name;

-- التحقق من وجود delivery_latitude و delivery_longitude
SELECT 
  '11.2 تحقق من إحداثيات التوصيل' as check_name,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_latitude') as has_delivery_lat,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_longitude') as has_delivery_lng;

-- ========================================
-- 12. التحقق من index على driver_id
-- ========================================

SELECT 
  '12. Indexes على driver_id' as check_name,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'orders'
AND indexdef ILIKE '%driver_id%';

-- ========================================
-- 13. ملخص الفحص النهائي
-- ========================================

SELECT 
  '===== ملخص الفحص النهائي =====' as summary,
  (SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'drivers')) as drivers_table_exists,
  (SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'orders')) as orders_table_exists,
  (SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'users')) as users_table_exists,
  (SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'stores')) as stores_table_exists,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'drivers') as drivers_columns_count,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'orders' AND column_name IN ('driver_id', 'status', 'delivery_fee', 'customer_id', 'vendor_id')) as orders_required_columns,
  (SELECT COUNT(*) FROM drivers) as total_drivers,
  (SELECT COUNT(*) FROM orders WHERE driver_id IS NOT NULL) as orders_with_driver;

-- ========================================
-- 14. الأعمدة المفقودة المحتملة في drivers
-- ========================================

SELECT '14. فحص الأعمدة في drivers' as check_title;

-- قائمة الأعمدة المطلوبة
WITH required_columns AS (
  SELECT unnest(ARRAY[
    'id',
    'user_id',
    'is_available',
    'current_location',
    'latitude',
    'longitude',
    'status',
    'total_distance',
    'today_distance',
    'created_at',
    'updated_at'
  ]) as column_name
),
existing_columns AS (
  SELECT column_name
  FROM information_schema.columns
  WHERE table_name = 'drivers'
)
SELECT 
  rc.column_name as missing_column,
  CASE 
    WHEN rc.column_name IN ('id') THEN 'UUID PRIMARY KEY'
    WHEN rc.column_name IN ('user_id') THEN 'UUID REFERENCES users(id)'
    WHEN rc.column_name IN ('is_available') THEN 'BOOLEAN DEFAULT false'
    WHEN rc.column_name IN ('status') THEN 'TEXT DEFAULT ''offline'''
    WHEN rc.column_name IN ('current_location') THEN 'TEXT'
    WHEN rc.column_name IN ('latitude', 'longitude') THEN 'NUMERIC'
    WHEN rc.column_name IN ('total_distance', 'today_distance') THEN 'NUMERIC DEFAULT 0'
    WHEN rc.column_name IN ('created_at', 'updated_at') THEN 'TIMESTAMP WITH TIME ZONE DEFAULT NOW()'
  END as suggested_type
FROM required_columns rc
LEFT JOIN existing_columns ec ON rc.column_name = ec.column_name
WHERE ec.column_name IS NULL;

-- ========================================
-- 15. الأعمدة المفقودة المحتملة في orders
-- ========================================

SELECT '15. فحص الأعمدة في orders' as check_title;

WITH required_columns AS (
  SELECT unnest(ARRAY[
    'delivery_latitude',
    'delivery_longitude'
  ]) as column_name
),
existing_columns AS (
  SELECT column_name
  FROM information_schema.columns
  WHERE table_name = 'orders'
)
SELECT 
  rc.column_name as missing_column,
  'NUMERIC' as suggested_type,
  'Required for location tracking in driver dashboard' as reason
FROM required_columns rc
LEFT JOIN existing_columns ec ON rc.column_name = ec.column_name
WHERE ec.column_name IS NULL;

-- ✅ انتهى الفحص
