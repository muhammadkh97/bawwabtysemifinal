-- =====================================================
-- 🔍 سكريبت تشخيص شامل لنظام الدردشة
-- =====================================================
-- التاريخ: 2026-01-07
-- الهدف: فحص كامل لنظام الدردشة والرسائل
-- =====================================================

-- ==================================================
-- 1️⃣ فحص جداول الدردشة
-- ==================================================
SELECT '=== 📊 الجداول الموجودة ===' as info;

SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE tablename IN ('chats', 'messages', 'chat_participants')
ORDER BY tablename;

-- ==================================================
-- 2️⃣ فحص أعمدة جدول chats
-- ==================================================
SELECT '=== 📋 أعمدة جدول chats ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'chats'
ORDER BY ordinal_position;

-- ==================================================
-- 3️⃣ فحص أعمدة جدول messages
-- ==================================================
SELECT '=== 📋 أعمدة جدول messages ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- ==================================================
-- 4️⃣ فحص حالة RLS
-- ==================================================
SELECT '=== 🔒 حالة RLS للجداول ===' as info;

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('chats', 'messages', 'chat_participants')
ORDER BY tablename;

-- ==================================================
-- 5️⃣ فحص Policies على جدول chats
-- ==================================================
SELECT '=== 📜 Policies لجدول chats ===' as info;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    LEFT(qual::text, 100) as qual_preview,
    LEFT(with_check::text, 100) as with_check_preview
FROM pg_policies
WHERE tablename = 'chats'
ORDER BY policyname;

-- ==================================================
-- 6️⃣ فحص Policies على جدول messages
-- ==================================================
SELECT '=== 📜 Policies لجدول messages ===' as info;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    LEFT(qual::text, 100) as qual_preview,
    LEFT(with_check::text, 100) as with_check_preview
FROM pg_policies
WHERE tablename = 'messages'
ORDER BY policyname;

-- ==================================================
-- 7️⃣ فحص صلاحيات الجداول
-- ==================================================
SELECT '=== 🔑 صلاحيات الجداول ===' as info;

SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE table_name IN ('chats', 'messages', 'chat_participants')
    AND grantee IN ('authenticated', 'anon', 'postgres')
ORDER BY table_name, grantee, privilege_type;

-- ==================================================
-- 8️⃣ فحص المستخدم الحالي
-- ==================================================
SELECT '=== 👤 معلومات المستخدم الحالي ===' as info;

SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_user_email;

SELECT 
    id,
    email,
    full_name,
    role
FROM users
WHERE id = auth.uid();

-- ==================================================
-- 9️⃣ إحصائيات المحادثات
-- ==================================================
SELECT '=== 📊 إحصائيات المحادثات ===' as info;

SELECT 
    COUNT(*) as total_chats,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_chats,
    COUNT(CASE WHEN is_archived = true THEN 1 END) as archived_chats,
    COUNT(CASE WHEN chat_type = 'direct' THEN 1 END) as direct_chats,
    COUNT(CASE WHEN chat_type = 'group' THEN 1 END) as group_chats,
    COUNT(CASE WHEN chat_type = 'support' THEN 1 END) as support_chats
FROM chats;

-- ==================================================
-- 🔟 إحصائيات الرسائل
-- ==================================================
SELECT '=== 📨 إحصائيات الرسائل ===' as info;

SELECT 
    COUNT(*) as total_messages,
    COUNT(CASE WHEN is_read = true THEN 1 END) as read_messages,
    COUNT(CASE WHEN is_read = false THEN 1 END) as unread_messages,
    COUNT(CASE WHEN is_deleted = true THEN 1 END) as deleted_messages,
    COUNT(CASE WHEN is_edited = true THEN 1 END) as edited_messages,
    COUNT(CASE WHEN sender_role = 'customer' THEN 1 END) as customer_messages,
    COUNT(CASE WHEN sender_role = 'vendor' THEN 1 END) as vendor_messages,
    COUNT(CASE WHEN sender_role = 'admin' THEN 1 END) as admin_messages,
    COUNT(CASE WHEN sender_role = 'driver' THEN 1 END) as driver_messages
FROM messages;

-- ==================================================
-- 1️⃣1️⃣ عينة من المحادثات (أول 5)
-- ==================================================
SELECT '=== 📊 عينة من المحادثات ===' as info;

SELECT 
    id,
    customer_id,
    vendor_id,
    chat_type,
    last_message,
    last_message_at,
    customer_unread_count,
    vendor_unread_count,
    is_active,
    is_archived,
    created_at
FROM chats
ORDER BY last_message_at DESC NULLS LAST
LIMIT 5;

-- ==================================================
-- 1️⃣2️⃣ عينة من الرسائل (أحدث 10)
-- ==================================================
SELECT '=== 📨 عينة من الرسائل ===' as info;

SELECT 
    id,
    chat_id,
    sender_id,
    sender_role,
    LEFT(content, 50) as content_preview,
    message_type,
    is_read,
    is_deleted,
    created_at
FROM messages
ORDER BY created_at DESC
LIMIT 10;

-- ==================================================
-- 1️⃣3️⃣ فحص العلاقات (Foreign Keys)
-- ==================================================
SELECT '=== 🔗 العلاقات (Foreign Keys) ===' as info;

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
    AND tc.table_name IN ('chats', 'messages', 'chat_participants')
ORDER BY tc.table_name, kcu.column_name;

-- ==================================================
-- 1️⃣4️⃣ فحص الـ Triggers
-- ==================================================
SELECT '=== ⚡ الـ Triggers على جدول chats ===' as info;

SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_orientation
FROM information_schema.triggers
WHERE event_object_table = 'chats'
ORDER BY trigger_name;

SELECT '=== ⚡ الـ Triggers على جدول messages ===' as info;

SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_orientation
FROM information_schema.triggers
WHERE event_object_table = 'messages'
ORDER BY trigger_name;

-- ==================================================
-- 1️⃣5️⃣ فحص الـ Functions المستخدمة
-- ==================================================
SELECT '=== ⚙️ الـ Functions المتعلقة بالدردشة ===' as info;

SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND (routine_name LIKE '%chat%' OR routine_name LIKE '%message%')
ORDER BY routine_name;

-- ==================================================
-- 1️⃣6️⃣ اختبار إنشاء محادثة
-- ==================================================
SELECT '=== 🧪 اختبار الوصول لإنشاء محادثة ===' as info;

-- محاولة عرض المحادثات الخاصة بالمستخدم الحالي
SELECT COUNT(*) as my_chats_count
FROM chats
WHERE customer_id = auth.uid() OR vendor_id = auth.uid();

-- ==================================================
-- 1️⃣7️⃣ اختبار إرسال رسالة
-- ==================================================
SELECT '=== 🧪 اختبار الوصول لإرسال رسالة ===' as info;

-- محاولة عرض الرسائل الخاصة بالمستخدم الحالي
SELECT COUNT(*) as my_messages_count
FROM messages
WHERE sender_id = auth.uid();

-- ==================================================
-- 1️⃣8️⃣ فحص الأدوار المشاركة في المحادثات
-- ==================================================
SELECT '=== 👥 الأدوار المشاركة في المحادثات ===' as info;

SELECT 
    u.role,
    COUNT(DISTINCT CASE WHEN c.customer_id = u.id THEN c.id END) as as_customer,
    COUNT(DISTINCT CASE WHEN c.vendor_id = u.id THEN c.id END) as as_vendor
FROM users u
LEFT JOIN chats c ON u.id = c.customer_id OR u.id = c.vendor_id
GROUP BY u.role
ORDER BY u.role;

-- ==================================================
-- ✅ نهاية السكريبت التشخيصي
-- ==================================================
SELECT 
    '=== ✅ انتهى الفحص التشخيصي ===' as info,
    NOW() as timestamp;
