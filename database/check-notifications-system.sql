-- ============================================
-- 🔍 فحص شامل لنظام الإشعارات
-- Comprehensive Notifications System Audit
-- ============================================

\echo '============================================'
\echo '📊 1. بنية جدول notifications'
\echo '============================================'

SELECT 
    column_name,
    data_type,
    character_maximum_length,
    column_default,
    is_nullable,
    CASE 
        WHEN column_name = 'id' THEN '🔑 Primary Key'
        WHEN column_name = 'user_id' THEN '🔗 Foreign Key → users'
        WHEN column_name = 'link' THEN '🔗 URL للانتقال'
        WHEN column_name = 'read_at' THEN '📅 وقت القراءة'
        WHEN column_name = 'priority' THEN '⚡ الأولوية'
        WHEN column_name = 'category' THEN '📁 التصنيف'
        ELSE ''
    END as description
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'notifications'
ORDER BY ordinal_position;

\echo ''
\echo '============================================'
\echo '🔐 2. RLS Policies على notifications'
\echo '============================================'

SELECT 
    policyname as "Policy Name",
    cmd as "Command",
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || qual
        ELSE 'No USING'
    END as "Using Clause",
    CASE 
        WHEN with_check IS NOT NULL THEN 'CHECK: ' || with_check
        ELSE 'No CHECK'
    END as "With Check"
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'notifications'
ORDER BY cmd, policyname;

\echo ''
\echo '============================================'
\echo '⚙️ 3. RPC Functions للإشعارات'
\echo '============================================'

SELECT 
    proname as "Function Name",
    pg_get_function_identity_arguments(oid) as "Arguments",
    CASE prosecdef 
        WHEN true THEN '✅ SECURITY DEFINER'
        ELSE '❌ No Security'
    END as "Security",
    CASE provolatile
        WHEN 'v' THEN 'VOLATILE'
        WHEN 's' THEN 'STABLE'
        WHEN 'i' THEN 'IMMUTABLE'
    END as "Volatility"
FROM pg_proc
WHERE proname IN (
    'get_unread_count',
    'mark_notification_read',
    'mark_all_notifications_read',
    'create_notification',
    'cleanup_old_notifications',
    'get_user_notifications'
)
ORDER BY proname;

\echo ''
\echo '============================================'
\echo '📈 4. Indexes على notifications'
\echo '============================================'

SELECT 
    indexname as "Index Name",
    indexdef as "Definition"
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'notifications'
ORDER BY indexname;

\echo ''
\echo '============================================'
\echo '🔒 5. Constraints على notifications'
\echo '============================================'

SELECT
    conname AS "Constraint Name",
    CASE contype
        WHEN 'p' THEN '🔑 PRIMARY KEY'
        WHEN 'f' THEN '🔗 FOREIGN KEY'
        WHEN 'c' THEN '✓ CHECK'
        WHEN 'u' THEN '🔒 UNIQUE'
        ELSE contype::text
    END AS "Type",
    pg_get_constraintdef(oid) AS "Definition"
FROM pg_constraint
WHERE conrelid = 'public.notifications'::regclass
ORDER BY contype, conname;

\echo ''
\echo '============================================'
\echo '📊 6. إحصائيات الإشعارات'
\echo '============================================'

SELECT 
    COUNT(*) as "Total Notifications",
    COUNT(*) FILTER (WHERE is_read = true) as "Read",
    COUNT(*) FILTER (WHERE is_read = false) as "Unread",
    COUNT(DISTINCT user_id) as "Unique Users",
    COUNT(DISTINCT type) as "Notification Types"
FROM notifications;

\echo ''
\echo '============================================'
\echo '📋 7. أنواع الإشعارات المستخدمة'
\echo '============================================'

SELECT 
    type as "Notification Type",
    COUNT(*) as "Count",
    COUNT(*) FILTER (WHERE is_read = false) as "Unread",
    MAX(created_at) as "Last Used"
FROM notifications
WHERE type IS NOT NULL
GROUP BY type
ORDER BY "Count" DESC;

\echo ''
\echo '============================================'
\echo '🔍 8. فحص الحقول المفقودة'
\echo '============================================'

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'link') 
        THEN '✅ link - موجود'
        ELSE '❌ link - مفقود'
    END as "link field",
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read_at') 
        THEN '✅ read_at - موجود'
        ELSE '❌ read_at - مفقود'
    END as "read_at field",
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'priority') 
        THEN '✅ priority - موجود'
        ELSE '❌ priority - مفقود'
    END as "priority field",
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'category') 
        THEN '✅ category - موجود'
        ELSE '❌ category - مفقود'
    END as "category field";

\echo ''
\echo '============================================'
\echo '🔍 9. فحص RPC Functions المفقودة'
\echo '============================================'

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_unread_count') 
        THEN '✅ get_unread_count - موجودة'
        ELSE '❌ get_unread_count - مفقودة'
    END as "Function 1",
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'mark_notification_read') 
        THEN '✅ mark_notification_read - موجودة'
        ELSE '❌ mark_notification_read - مفقودة'
    END as "Function 2",
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'mark_all_notifications_read') 
        THEN '✅ mark_all_notifications_read - موجودة'
        ELSE '❌ mark_all_notifications_read - مفقودة'
    END as "Function 3",
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_notification') 
        THEN '✅ create_notification - موجودة'
        ELSE '❌ create_notification - مفقودة'
    END as "Function 4";

\echo ''
\echo '============================================'
\echo '🔍 10. فحص Policies المفقودة'
\echo '============================================'

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND cmd = 'SELECT') 
        THEN '✅ SELECT Policy - موجودة'
        ELSE '❌ SELECT Policy - مفقودة'
    END as "Policy 1",
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND cmd = 'UPDATE') 
        THEN '✅ UPDATE Policy - موجودة'
        ELSE '❌ UPDATE Policy - مفقودة'
    END as "Policy 2",
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND cmd = 'INSERT') 
        THEN '✅ INSERT Policy - موجودة'
        ELSE '❌ INSERT Policy - مفقودة'
    END as "Policy 3",
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notifications' AND cmd = 'DELETE') 
        THEN '✅ DELETE Policy - موجودة'
        ELSE '❌ DELETE Policy - مفقودة'
    END as "Policy 4";

\echo ''
\echo '============================================'
\echo '✅ الفحص اكتمل!'
\echo '============================================'
