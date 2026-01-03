-- ==========================================
-- PART 3: أمثلة لتحديث المستخدمين والتحقق
-- ==========================================
-- شغّل هذا الجزء بعد اكتمال PART 1 و PART 2

-- ==========================================
-- الخطوة 1: عرض جميع البائعين الذين لديهم مطاعم
-- ==========================================
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    s.name as store_name,
    s.business_type
FROM users u
INNER JOIN stores s ON s.user_id = u.id
WHERE s.business_type = 'restaurant'
ORDER BY u.created_at DESC;

-- ==========================================
-- الخطوة 2: تحويل بائع واحد إلى دور restaurant
-- ==========================================
-- قم بتعديل البريد الإلكتروني واستعلم عن النتيجة
/*
UPDATE users u
SET role = 'restaurant'
FROM stores s
WHERE s.user_id = u.id
AND s.business_type = 'restaurant'
AND u.role = 'vendor'
AND u.email = 'restaurant@example.com';

-- التحقق من التحديث
SELECT id, email, role FROM users WHERE email = 'restaurant@example.com';
*/

-- ==========================================
-- الخطوة 3: تحويل جميع أصحاب المطاعم إلى دور restaurant
-- ==========================================
-- احذر! هذا سيحول جميع البائعين الذين لديهم مطاعم
-- قم بـ UNCOMMENT فقط إذا كنت متأكداً
/*
UPDATE users u
SET role = 'restaurant'
FROM stores s
WHERE s.user_id = u.id
AND s.business_type = 'restaurant'
AND u.role = 'vendor';
*/

-- ==========================================
-- الخطوة 4: عرض ملخص الأدوار
-- ==========================================
SELECT 
    role,
    COUNT(*) as user_count,
    COUNT(DISTINCT s.id) as stores_count
FROM users u
LEFT JOIN stores s ON s.user_id = u.id
GROUP BY role
ORDER BY user_count DESC;

-- ==========================================
-- الخطوة 5: عرض تفاصيل المطاعم
-- ==========================================
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.user_role,
    s.id as store_id,
    s.name as store_name,
    s.business_type,
    s.is_active,
    s.approval_status
FROM users u
LEFT JOIN stores s ON s.user_id = u.id
WHERE u.role = 'restaurant' OR s.business_type = 'restaurant'
ORDER BY u.created_at DESC;

-- ==========================================
-- الخطوة 6: إنشاء مطعم جديد (مثال)
-- ==========================================
/*
-- 1. أنشئ حساب جديد أولاً (عبر التطبيق)
-- 2. أو استخدم بريد موجود

-- ثم شغّل هذا:
UPDATE users 
SET role = 'restaurant'
WHERE email = 'new_restaurant@example.com';

INSERT INTO stores (
    user_id,
    name,
    name_ar,
    business_type,
    phone,
    email,
    address,
    lat,
    lng,
    is_online,
    is_active,
    approval_status
)
SELECT 
    id,
    'مطعمي الجديد',
    'مطعمي الجديد',
    'restaurant',
    '0500000000',
    email,
    'شارع الملك فهد',
    24.7136,
    46.6753,
    true,
    true,
    'approved'
FROM users
WHERE email = 'new_restaurant@example.com'
AND NOT EXISTS (
    SELECT 1 FROM stores WHERE user_id = users.id
);
*/

-- ==========================================
-- رسالة النهاية
-- ==========================================

DO $$
BEGIN
  RAISE NOTICE '✅ اكتمل إضافة دور restaurant بنجاح!';
  RAISE NOTICE '📊 استخدم الاستعلامات أعلاه للتحقق والتحديث';
  RAISE NOTICE '🔄 لا تنسى: اذهب إلى Supabase Settings → API → Reload schema cache';
  RAISE NOTICE '🚀 بعدها يمكنك اختبار التطبيق';
END $$;
