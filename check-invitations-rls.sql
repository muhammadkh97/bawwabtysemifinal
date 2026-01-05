-- ═══════════════════════════════════════════════════════════════
-- 🔍 فحص صلاحيات RLS على staff_invitations
-- ═══════════════════════════════════════════════════════════════

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🛡️ الجزء 1: فحص سياسات RLS على staff_invitations
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
    '🛡️ سياسات RLS' as info,
    schemaname as "Schema",
    tablename as "الجدول",
    policyname as "اسم السياسة",
    permissive as "نوع السماح",
    roles as "الأدوار",
    cmd as "الأمر",
    qual as "شرط WHERE"
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'staff_invitations';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔍 الجزء 2: فحص بنية جدول staff_invitations
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
    '📋 بنية الجدول' as info,
    column_name as "اسم العمود",
    data_type as "نوع البيانات",
    is_nullable as "يقبل NULL"
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'staff_invitations'
ORDER BY ordinal_position;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔍 الجزء 3: فحص العلاقة مع جدول users
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
    '🔗 المفاتيح الأجنبية' as info,
    tc.constraint_name as "اسم القيد",
    kcu.column_name as "العمود المصدر",
    ccu.table_name as "الجدول المرتبط",
    ccu.column_name as "العمود المرتبط"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'staff_invitations'
  AND tc.constraint_type = 'FOREIGN KEY';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 🔍 الجزء 4: محاولة جلب الدعوة بنفس الطريقة التي يستخدمها الكود
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SELECT 
    '📊 محاكاة استعلام الصفحة' as info,
    si.*,
    u.full_name as "invited_by_full_name"
FROM staff_invitations si
LEFT JOIN users u ON si.invited_by = u.id
WHERE si.email = 'muhmdakh@gmail.com'
  AND si.status = 'pending'
  AND si.expires_at > NOW()
ORDER BY si.created_at DESC;
