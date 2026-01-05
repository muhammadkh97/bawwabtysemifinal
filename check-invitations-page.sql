-- ═══════════════════════════════════════════════════════════════
-- 🔍 فحص مشكلة صفحة الدعوات
-- ═══════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔍 الجزء 1: فحص الدعوات المعلقة للمستخدم
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
    '🔍 الدعوات المعلقة' as info,
    si.id,
    si.email as "البريد الإلكتروني",
    si.business_type as "نوع العمل",
    si.business_id as "معرف المتجر",
    si.status as "الحالة",
    si.permissions as "الصلاحيات",
    si.expires_at as "تنتهي في",
    si.created_at as "تاريخ الإنشاء",
    CASE 
        WHEN si.expires_at > NOW() THEN 'صالحة'
        ELSE 'منتهية'
    END as "حالة الصلاحية"
FROM staff_invitations si
WHERE si.email = 'muhmdakh@gmail.com'
  AND si.status = 'pending'
ORDER BY si.created_at DESC;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔍 الجزء 2: فحص جميع الدعوات (بغض النظر عن الحالة)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
    '🔍 جميع الدعوات' as info,
    si.id,
    si.email as "البريد الإلكتروني",
    si.business_type as "نوع العمل",
    si.status as "الحالة",
    si.expires_at as "تنتهي في",
    CASE 
        WHEN si.expires_at > NOW() THEN 'صالحة'
        ELSE 'منتهية'
    END as "حالة الصلاحية"
FROM staff_invitations si
WHERE si.email = 'muhmdakh@gmail.com'
ORDER BY si.created_at DESC;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ✅ الجزء 3: إنشاء دعوة جديدة صالحة (إذا لم توجد)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- قم بإزالة التعليق إذا أردت إنشاء دعوة جديدة:
/*
-- حذف الدعوات المنتهية أو الملغاة
DELETE FROM staff_invitations
WHERE email = 'muhmdakh@gmail.com'
  AND (status != 'pending' OR expires_at < NOW());

-- إنشاء دعوة جديدة
INSERT INTO staff_invitations (
    invitation_code,
    email,
    business_type,
    business_id,
    invited_by,
    permissions,
    status,
    expires_at
) VALUES (
    md5(random()::text || clock_timestamp()::text),
    'muhmdakh@gmail.com',
    'vendor',
    '6186f1a0-7f95-4d54-ac70-391127079a3f',
    '05dc64f1-bc85-4b01-af5e-e15f8688b939',
    '["view_orders", "manage_products"]'::jsonb,
    'pending',
    NOW() + INTERVAL '7 days'
);

SELECT '✅ تم إنشاء دعوة جديدة' as result;
*/

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 📊 الجزء 4: التحقق النهائي
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
    '📊 النتيجة النهائية' as info,
    COUNT(*) as "عدد الدعوات المعلقة الصالحة"
FROM staff_invitations si
WHERE si.email = 'muhmdakh@gmail.com'
  AND si.status = 'pending'
  AND si.expires_at > NOW();
