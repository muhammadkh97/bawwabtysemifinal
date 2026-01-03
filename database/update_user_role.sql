-- ==========================================
-- سكريبت لتحديث دور المستخدم في قاعدة البيانات
-- ==========================================
-- استخدم هذا السكريبت لتغيير دور أي مستخدم

-- ==========================================
-- الأدوار المتاحة:
-- ==========================================
-- 'customer' - عميل (الافتراضي)
-- 'vendor' - بائع (متجر تجزئة فقط)
-- 'restaurant' - مطعم (أصحاب المطاعم)
-- 'driver' - مندوب توصيل
-- 'admin' - مدير النظام

-- ==========================================
-- ملاحظات مهمة:
-- ==========================================
-- 1. دور 'restaurant' منفصل عن 'vendor' في النظام الجديد
-- 2. البائعون (vendor) = المتاجر التجارية (retail)
-- 3. المطاعم (restaurant) = أصحاب المطاعم
-- 4. الفرق يتم تحديده أيضاً في جدول stores/vendors 
--    عن طريق عمود business_type ('retail' أو 'restaurant')

-- ==========================================
-- مثال 1: تغيير المستخدم إلى بائع (متجر أو مطعم)
-- ==========================================
-- استبدل 'user_email@example.com' بالبريد الإلكتروني الفعلي
UPDATE users 
SET role = 'vendor'
WHERE email = 'user_email@example.com';

-- ==========================================
-- مثال 2: تغيير المستخدم إلى مندوب توصيل
-- ==========================================
UPDATE users 
SET role = 'driver'
WHERE email = 'user_email@example.com';

-- ==========================================
-- مثال 3: تغيير المستخدم إلى مطعم
-- ==========================================
UPDATE users 
SET role = 'restaurant'
WHERE email = 'user_email@example.com';

-- ==========================================
-- مثال 4: تغيير المستخدم إلى مدير
-- ==========================================
UPDATE users 
SET role = 'admin'
WHERE email = 'user_email@example.com';

-- ==========================================
-- مثال 5: التحقق من دور المستخدم الحالي
-- ==========================================
SELECT 
    email,
    full_name,
    role,
    user_role,
    created_at
FROM users
WHERE email = 'user_email@example.com';

-- ==========================================
-- مثال 6: إنشاء متجر للبائع
-- ==========================================
-- بعد تغيير دور المستخدم إلى 'vendor'، أنشئ متجر تجزئة له:
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
    'اسم المتجر',
    'اسم المتجر بالعربي',
    'retail', -- متجر تجزئة
    '0500000000',
    email,
    'عنوان المتجر',
    24.7136,
    46.6753,
    true,
    true,
    'approved'
FROM users
WHERE email = 'user_email@example.com'
AND NOT EXISTS (
    SELECT 1 FROM stores WHERE user_id = users.id
);

-- ==========================================
-- مثال 7: إنشاء مطعم لصاحب المطعم
-- ==========================================
-- بعد تغيير دور المستخدم إلى 'restaurant'، أنشئ مطعم له:
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
    'اسم المطعم',
    'اسم المطعم بالعربي',
    'restaurant', -- مطعم
    '0500000000',
    email,
    'عنوان المطعم',
    24.7136,
    46.6753,
    true,
    true,
    'approved'
FROM users
WHERE email = 'user_email@example.com'
AND NOT EXISTS (
    SELECT 1 FROM stores WHERE user_id = users.id
);

-- ==========================================
-- مثال 8: إنشاء ملف سائق
-- ==========================================
-- بعد تغيير دور المستخدم إلى 'driver'، أنشئ ملف له:
INSERT INTO drivers (
    user_id,
    vehicle_type,
    vehicle_number,
    license_number,
    approval_status,
    status,
    is_available,
    is_active
)
SELECT 
    id,
    'سيارة',
    'ABC-1234',
    'LIC-123456',
    'approved',
    'idle',
    true,
    true
FROM users
WHERE email = 'user_email@example.com'
AND NOT EXISTS (
    SELECT 1 FROM drivers WHERE user_id = users.id
);

-- ==========================================
-- مثال 9: عرض جميع البائعين مع متاجرهم
-- ==========================================
SELECT 
    u.email,
    u.full_name,
    u.role,
    s.name as store_name,
    s.business_type,
    s.is_active,
    s.approval_status
FROM users u
LEFT JOIN stores s ON s.user_id = u.id
WHERE u.role = 'vendor'
ORDER BY u.created_at DESC;

-- ==========================================
-- مثال 10: عرض جميع المطاعم مع أصحابها
-- ==========================================
SELECT 
    u.email,
    u.full_name,
    u.role,
    s.name as restaurant_name,
    s.business_type,
    s.is_active,
    s.approval_status
FROM users u
LEFT JOIN stores s ON s.user_id = u.id
WHERE u.role = 'restaurant'
ORDER BY u.created_at DESC;

-- ==========================================
-- مثال 11: عرض جميع السائقين
-- ==========================================
SELECT 
    u.email,
    u.full_name,
    u.role,
    d.vehicle_type,
    d.status,
    d.is_available,
    d.approval_status
FROM users u
LEFT JOIN drivers d ON d.user_id = u.id
WHERE u.role = 'driver'
ORDER BY u.created_at DESC;

-- ==========================================
-- نصيحة: استخدم هذا الاستعلام للتحقق من كل شيء
-- ==========================================
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.role,
    u.user_role,
    s.business_type,
    CASE 
        WHEN s.id IS NOT NULL THEN 'لديه متجر/مطعم'
        ELSE 'لا يوجد متجر/مطعم'
    END as store_status,
    CASE 
        WHEN d.id IS NOT NULL THEN 'لديه ملف سائق'
        ELSE 'لا يوجد ملف سائق'
    END as driver_status
FROM users u
LEFT JOIN stores s ON s.user_id = u.id
LEFT JOIN drivers d ON d.user_id = u.id
WHERE u.email = 'user_email@example.com';

-- ==========================================
-- مثال 12: تحويل جميع البائعين الذين لديهم مطاعم إلى دور restaurant
-- ==========================================
-- UNCOMMENT للتنفيذ (كن حذراً!)
/*
UPDATE users u
SET role = 'restaurant'
FROM stores s
WHERE s.user_id = u.id
AND s.business_type = 'restaurant'
AND u.role = 'vendor';

-- التحقق من التحديث
SELECT 
    u.role,
    COUNT(*) as count,
    string_agg(u.email, ', ') as emails
FROM users u
INNER JOIN stores s ON s.user_id = u.id
WHERE s.business_type = 'restaurant'
GROUP BY u.role;
*/
