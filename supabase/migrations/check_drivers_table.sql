-- =====================================================
-- 🔍 فحص جدول السائقين (drivers)
-- =====================================================

-- =====================================================
-- 📊 السكريبت 1: التحقق من وجود جدول drivers
-- =====================================================
SELECT 
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'drivers';

-- =====================================================
-- 📊 السكريبت 2: فحص أعمدة جدول drivers
-- =====================================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'drivers'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- =====================================================
-- 📊 السكريبت 3: فحص Foreign Keys في جدول drivers
-- =====================================================
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'drivers'
AND tc.constraint_type = 'FOREIGN KEY';

-- =====================================================
-- 📊 السكريبت 4: عرض جميع السائقين في الجدول
-- =====================================================
SELECT 
  id,
  user_id,
  vehicle_type,
  vehicle_number,
  license_number,
  approval_status,
  status,
  is_available,
  is_active,
  created_at
FROM drivers
ORDER BY created_at DESC;

-- =====================================================
-- 📊 السكريبت 5: التحقق من المستخدمين المسجلين
-- =====================================================
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- 📊 السكريبت 6: مطابقة السائقين مع المستخدمين
-- =====================================================
SELECT 
  u.id as user_id,
  u.email,
  u.raw_user_meta_data->>'role' as user_role,
  d.id as driver_id,
  d.vehicle_type,
  d.approval_status,
  d.status as driver_status,
  d.is_available
FROM auth.users u
LEFT JOIN drivers d ON d.user_id = u.id
WHERE u.raw_user_meta_data->>'role' = 'driver'
ORDER BY u.created_at DESC;
