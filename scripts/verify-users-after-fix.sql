-- ============================================
-- فحص وتأكيد بيانات المستخدمين بعد الإصلاح
-- ============================================

-- 1. التحقق من أن جميع المستخدمين لديهم role صحيح
SELECT 
    id,
    email,
    full_name,
    role,
    user_role,
    is_active,
    CASE 
        WHEN role IS NULL THEN '❌ role فارغ'
        WHEN user_role IS NOT NULL AND user_role != role::text THEN '⚠️ عدم تطابق'
        ELSE '✅ صحيح'
    END as status
FROM public.users
ORDER BY created_at DESC;

-- 2. إحصائيات الأدوار
SELECT 
    role,
    COUNT(*) as count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
FROM public.users
GROUP BY role
ORDER BY count DESC;

-- 3. التحقق من المستخدمين الذين role و user_role مختلفان
SELECT 
    id,
    email,
    role,
    user_role,
    'user_role should match role' as issue
FROM public.users
WHERE user_role IS NOT NULL 
    AND user_role != role::text;

-- 4. تحديث user_role ليطابق role (إذا لزم الأمر)
-- تشغيل هذا فقط إذا وجدت مستخدمين في الاستعلام رقم 3
-- UPDATE public.users 
-- SET user_role = role::text
-- WHERE user_role IS NOT NULL 
--     AND user_role != role::text;

-- 5. التحقق من auth.users (جدول المصادقة)
SELECT 
    id,
    email,
    confirmed_at IS NOT NULL as email_confirmed,
    last_sign_in_at,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
