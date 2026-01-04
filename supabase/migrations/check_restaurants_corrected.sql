-- =====================================================
-- 🔍 سكريبتات فحص مصححة للمطاعم
-- =====================================================

-- =====================================================
-- 📊 السكريبت 1: فحص business_type بدلاً من type
-- =====================================================
SELECT 
  business_type,
  COUNT(*) as count
FROM stores
GROUP BY business_type
ORDER BY count DESC;

-- =====================================================
-- 🔍 السكريبت 2: فحص جميع القيم الممكنة لـ business_type
-- =====================================================
SELECT 
  e.enumlabel as business_type_value
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'business_type'
ORDER BY e.enumsortorder;

-- =====================================================
-- 🔍 السكريبت 3: البحث عن المطعم باستخدام user_id
-- =====================================================
SELECT 
  id,
  user_id,
  name,
  business_type,
  is_active,
  approval_status,
  created_at
FROM stores
WHERE user_id = '6a7c47f6-78a2-4975-a049-172dc783524d';

-- =====================================================
-- 🔍 السكريبت 4: فحص العلاقة بين users و stores للمطاعم
-- =====================================================
SELECT 
  u.id as user_id,
  u.email,
  u.full_name,
  u.role,
  s.id as store_id,
  s.name as store_name,
  s.business_type
FROM users u
LEFT JOIN stores s ON s.user_id = u.id
WHERE u.role = 'restaurant'
LIMIT 5;

-- =====================================================
-- 🔍 السكريبت 5: فحص جميع المطاعم في stores
-- =====================================================
SELECT 
  id,
  user_id,
  name,
  business_type,
  is_active,
  approval_status
FROM stores
WHERE business_type = 'restaurant'
LIMIT 10;

-- =====================================================
-- 🔍 السكريبت 6: فحص user_id المطعم في جدول users
-- =====================================================
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM users
WHERE id = '6a7c47f6-78a2-4975-a049-172dc783524d';
