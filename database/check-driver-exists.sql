-- ============================================
-- فحص وجود السائق في جدول drivers
-- ============================================

-- 1. عرض جميع المستخدمين بدور driver
SELECT 
  u.id AS user_id,
  u.email AS البريد,
  u.raw_user_meta_data->>'name' AS الاسم,
  u.raw_user_meta_data->>'role' AS الدور_في_metadata,
  CASE 
    WHEN d.id IS NOT NULL THEN '✅ موجود'
    ELSE '❌ غير موجود'
  END AS في_جدول_drivers,
  d.id AS driver_id
FROM auth.users u
LEFT JOIN drivers d ON d.user_id = u.id
WHERE u.raw_user_meta_data->>'role' = 'driver';

-- 2. عرض جميع السجلات في جدول drivers
SELECT 
  d.id,
  d.user_id,
  d.vehicle_type AS نوع_المركبة,
  d.license_number AS رقم_الرخصة,
  d.is_available AS متاح,
  u.email AS البريد,
  u.raw_user_meta_data->>'name' AS الاسم
FROM drivers d
LEFT JOIN auth.users u ON u.id = d.user_id;

-- 3. إنشاء سجل driver للمستخدمين الذين لديهم دور driver ولكن غير موجودين في جدول drivers
INSERT INTO drivers (user_id, vehicle_type, license_number, is_available, phone, status)
SELECT 
  u.id,
  'car' AS vehicle_type,
  'TEMP-' || SUBSTRING(u.id::text, 1, 8) AS license_number,
  true AS is_available,
  u.phone AS phone,
  'active' AS status
FROM auth.users u
WHERE u.raw_user_meta_data->>'role' = 'driver'
  AND NOT EXISTS (
    SELECT 1 FROM drivers d WHERE d.user_id = u.id
  );

-- 4. التحقق من النتائج
SELECT 
  '✅ تم التحقق من جميع السائقين' AS الحالة,
  COUNT(*) AS عدد_السائقين_في_drivers
FROM drivers;

-- 5. عرض السائقين المضافين حديثاً
SELECT 
  d.id,
  d.user_id,
  d.vehicle_type,
  d.license_number,
  u.email,
  u.raw_user_meta_data->>'name' AS الاسم
FROM drivers d
JOIN auth.users u ON u.id = d.user_id
WHERE d.created_at > NOW() - INTERVAL '5 minutes';
