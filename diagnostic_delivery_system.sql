-- =====================================================
-- 🔍 سكريبت تشخيص شامل لنظام التوصيل
-- =====================================================
-- التاريخ: 2026-01-07
-- الهدف: استخراج جميع المعلومات اللازمة لحل مشكلة الصلاحيات
-- =====================================================

-- ==================================================
-- 1️⃣ فحص الجداول الموجودة
-- ==================================================
SELECT 
    '=== 📊 الجداول الموجودة ===' as info;

SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename IN ('delivery_zones', 'delivery_batches', 'users', 'drivers')
ORDER BY tablename;

-- ==================================================
-- 2️⃣ فحص أعمدة الجداول
-- ==================================================
SELECT 
    '=== 📋 أعمدة جدول delivery_zones ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'delivery_zones'
ORDER BY ordinal_position;

SELECT 
    '=== 📋 أعمدة جدول delivery_batches ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'delivery_batches'
ORDER BY ordinal_position;

-- ==================================================
-- 3️⃣ فحص حالة RLS
-- ==================================================
SELECT 
    '=== 🔒 حالة RLS للجداول ===' as info;

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('delivery_zones', 'delivery_batches', 'users', 'drivers')
ORDER BY tablename;

-- ==================================================
-- 4️⃣ فحص Policies الموجودة حالياً
-- ==================================================
SELECT 
    '=== 📜 Policies لجدول delivery_zones ===' as info;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'delivery_zones'
ORDER BY policyname;

SELECT 
    '=== 📜 Policies لجدول delivery_batches ===' as info;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'delivery_batches'
ORDER BY policyname;

-- ==================================================
-- 5️⃣ فحص المستخدم الحالي ودوره
-- ==================================================
SELECT 
    '=== 👤 معلومات المستخدم الحالي ===' as info;

SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_user_email;

SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM users
WHERE id = auth.uid();

-- ==================================================
-- 6️⃣ فحص صلاحيات الجداول (Table Permissions)
-- ==================================================
SELECT 
    '=== 🔑 صلاحيات الجداول ===' as info;

SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE table_name IN ('delivery_zones', 'delivery_batches')
ORDER BY table_name, grantee, privilege_type;

-- ==================================================
-- 7️⃣ اختبار الوصول المباشر
-- ==================================================
SELECT 
    '=== 🧪 اختبار قراءة delivery_zones ===' as info;

SELECT COUNT(*) as total_zones
FROM delivery_zones;

SELECT 
    '=== 🧪 اختبار قراءة delivery_batches ===' as info;

SELECT COUNT(*) as total_batches
FROM delivery_batches;

-- ==================================================
-- 8️⃣ فحص العلاقات بين الجداول
-- ==================================================
SELECT 
    '=== 🔗 العلاقات (Foreign Keys) ===' as info;

SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('delivery_zones', 'delivery_batches')
ORDER BY tc.table_name, kcu.column_name;

-- ==================================================
-- 9️⃣ فحص الـ Functions المستخدمة في Policies
-- ==================================================
SELECT 
    '=== ⚙️ الـ Functions الموجودة ===' as info;

SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name IN ('auth.uid', 'auth.email')
ORDER BY routine_name;

-- ==================================================
-- 🔟 فحص الأدوار (Roles) المتاحة
-- ==================================================
SELECT 
    '=== 👥 الأدوار في النظام ===' as info;

SELECT DISTINCT role, COUNT(*) as user_count
FROM users
GROUP BY role
ORDER BY role;

-- ==================================================
-- 1️⃣1️⃣ فحص جدول drivers
-- ==================================================
SELECT 
    '=== 🚗 معلومات جدول drivers ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'drivers'
ORDER BY ordinal_position;

-- ==================================================
-- 1️⃣2️⃣ فحص بيانات تجريبية
-- ==================================================
SELECT 
    '=== 📊 عينة من delivery_zones (أول 3 سجلات) ===' as info;

SELECT 
    id,
    name,
    name_ar,
    is_active,
    created_at
FROM delivery_zones
LIMIT 3;

SELECT 
    '=== 📊 عينة من delivery_batches (أول 3 سجلات) ===' as info;

SELECT 
    id,
    zone_id,
    driver_id,
    status,
    created_at
FROM delivery_batches
LIMIT 3;

-- ==================================================
-- ✅ نهاية السكريبت التشخيصي
-- ==================================================
SELECT 
    '=== ✅ انتهى الفحص التشخيصي ===' as info,
    NOW() as timestamp;
