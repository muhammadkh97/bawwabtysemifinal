-- =====================================================
-- 🔒 سكريبت فحص سياسات الأمان (RLS) لنظام الدردشة
-- Chat System RLS Policies Inspection
-- =====================================================
-- التاريخ: 2026-01-06
-- الهدف: فحص جميع سياسات Row Level Security
-- ملاحظة: نسخ كل استعلام وتشغيله في Supabase SQL Editor
-- =====================================================

-- ==================================================
-- 🔐 1. حالة RLS على الجداول
-- ==================================================

-- 1.1 التحقق من تفعيل RLS على جداول الدردشة
SELECT 
    '🔐 حالة RLS' as section,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('chats', 'messages');

-- ==================================================
-- 📋 2. سياسات جدول CHATS
-- ==================================================

-- 2.1 عرض جميع السياسات على جدول chats
SELECT 
    '📋 جميع سياسات CHATS' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'chats'
ORDER BY policyname;

-- 2.2 تفاصيل كل سياسة على جدول chats
SELECT 
    '📋 تفاصيل سياسات CHATS' as section,
    policyname as policy_name,
    cmd as operation,
    CASE 
        WHEN qual IS NOT NULL THEN qual 
        ELSE 'No USING clause'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN with_check 
        ELSE 'No WITH CHECK clause'
    END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'chats'
ORDER BY 
    CASE cmd
        WHEN 'SELECT' THEN 1
        WHEN 'INSERT' THEN 2
        WHEN 'UPDATE' THEN 3
        WHEN 'DELETE' THEN 4
        ELSE 5
    END,
    policyname;

-- ==================================================
-- 📋 3. سياسات جدول MESSAGES
-- ==================================================

-- 3.1 عرض جميع السياسات على جدول messages
SELECT 
    '📋 جميع سياسات MESSAGES' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as operation,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'messages'
ORDER BY policyname;

-- 3.2 تفاصيل كل سياسة على جدول messages
SELECT 
    '📋 تفاصيل سياسات MESSAGES' as section,
    policyname as policy_name,
    cmd as operation,
    CASE 
        WHEN qual IS NOT NULL THEN qual 
        ELSE 'No USING clause'
    END as using_clause,
    CASE 
        WHEN with_check IS NOT NULL THEN with_check 
        ELSE 'No WITH CHECK clause'
    END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'messages'
ORDER BY 
    CASE cmd
        WHEN 'SELECT' THEN 1
        WHEN 'INSERT' THEN 2
        WHEN 'UPDATE' THEN 3
        WHEN 'DELETE' THEN 4
        ELSE 5
    END,
    policyname;

-- ==================================================
-- 🔍 4. تحليل السياسات الحالية
-- ==================================================

-- 4.1 عدد السياسات لكل جدول
SELECT 
    '📊 عدد السياسات لكل عملية' as section,
    tablename,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN cmd = 'SELECT' THEN 1 END) as select_policies,
    COUNT(CASE WHEN cmd = 'INSERT' THEN 1 END) as insert_policies,
    COUNT(CASE WHEN cmd = 'UPDATE' THEN 1 END) as update_policies,
    COUNT(CASE WHEN cmd = 'DELETE' THEN 1 END) as delete_policies,
    COUNT(CASE WHEN cmd = 'ALL' THEN 1 END) as all_policies
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('chats', 'messages')
GROUP BY tablename;

-- ==================================================
-- ⚠️ 5. فحص السياسات المفقودة
-- ==================================================

-- 5.1 فحص سياسات CHATS
WITH chats_policies AS (
    SELECT DISTINCT cmd
    FROM pg_policies
    WHERE tablename = 'chats' AND schemaname = 'public'
)
SELECT 
    '⚠️ فحص سياسات CHATS المطلوبة' as section,
    'chats' as table_name,
    'SELECT' as operation,
    CASE WHEN EXISTS (SELECT 1 FROM chats_policies WHERE cmd IN ('SELECT', 'ALL')) 
        THEN '✅ موجودة' 
        ELSE '❌ مفقودة' 
    END as status
UNION ALL
SELECT 
    '⚠️ فحص سياسات CHATS المطلوبة',
    'chats',
    'INSERT',
    CASE WHEN EXISTS (SELECT 1 FROM chats_policies WHERE cmd IN ('INSERT', 'ALL')) 
        THEN '✅ موجودة' 
        ELSE '❌ مفقودة' 
    END
UNION ALL
SELECT 
    '⚠️ فحص سياسات CHATS المطلوبة',
    'chats',
    'UPDATE',
    CASE WHEN EXISTS (SELECT 1 FROM chats_policies WHERE cmd IN ('UPDATE', 'ALL')) 
        THEN '✅ موجودة' 
        ELSE '❌ مفقودة' 
    END
UNION ALL
SELECT 
    '⚠️ فحص سياسات CHATS المطلوبة',
    'chats',
    'DELETE',
    CASE WHEN EXISTS (SELECT 1 FROM chats_policies WHERE cmd IN ('DELETE', 'ALL')) 
        THEN '✅ موجودة' 
        ELSE '❌ مفقودة' 
    END;

-- 5.2 فحص سياسات MESSAGES
WITH messages_policies AS (
    SELECT DISTINCT cmd
    FROM pg_policies
    WHERE tablename = 'messages' AND schemaname = 'public'
)
SELECT 
    '⚠️ فحص سياسات MESSAGES المطلوبة' as section,
    'messages' as table_name,
    'SELECT' as operation,
    CASE WHEN EXISTS (SELECT 1 FROM messages_policies WHERE cmd IN ('SELECT', 'ALL')) 
        THEN '✅ موجودة' 
        ELSE '❌ مفقودة' 
    END as status
UNION ALL
SELECT 
    '⚠️ فحص سياسات MESSAGES المطلوبة',
    'messages',
    'INSERT',
    CASE WHEN EXISTS (SELECT 1 FROM messages_policies WHERE cmd IN ('INSERT', 'ALL')) 
        THEN '✅ موجودة' 
        ELSE '❌ مفقودة' 
    END
UNION ALL
SELECT 
    '⚠️ فحص سياسات MESSAGES المطلوبة',
    'messages',
    'UPDATE',
    CASE WHEN EXISTS (SELECT 1 FROM messages_policies WHERE cmd IN ('UPDATE', 'ALL')) 
        THEN '✅ موجودة' 
        ELSE '❌ مفقودة' 
    END
UNION ALL
SELECT 
    '⚠️ فحص سياسات MESSAGES المطلوبة',
    'messages',
    'DELETE',
    CASE WHEN EXISTS (SELECT 1 FROM messages_policies WHERE cmd IN ('DELETE', 'ALL')) 
        THEN '✅ موجودة' 
        ELSE '❌ مفقودة' 
    END;

-- ==================================================
-- 🔑 6. فحص الأدوار المسموح لها
-- ==================================================

-- 6.1 الأدوار المستخدمة في السياسات
SELECT DISTINCT
    '🔑 الأدوار المستخدمة' as section,
    tablename,
    unnest(roles) as role_name
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('chats', 'messages')
ORDER BY tablename, role_name;

-- ==================================================
-- 📊 7. تحليل شروط السياسات
-- ==================================================

-- 7.1 السياسات التي تستخدم auth.uid()
SELECT 
    '📊 السياسات التي تستخدم auth.uid()' as section,
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual::text LIKE '%auth.uid()%' OR with_check::text LIKE '%auth.uid()%' 
        THEN '✅ تستخدم auth.uid()' 
        ELSE '⚠️ لا تستخدم auth.uid()' 
    END as uses_auth_uid
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('chats', 'messages')
ORDER BY tablename, policyname;

-- 7.2 السياسات التي تفحص الأدوار
SELECT 
    '📊 السياسات التي تفحص الأدوار' as section,
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual::text LIKE '%role%' OR with_check::text LIKE '%role%' 
        THEN '✅ تفحص الأدوار' 
        ELSE '⚠️ لا تفحص الأدوار' 
    END as checks_roles
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('chats', 'messages')
ORDER BY tablename, policyname;

-- ==================================================
-- 🔍 8. التعريف الكامل للسياسات
-- ==================================================

-- 8.1 التعريف الكامل لسياسات CHATS
SELECT 
    '🔍 التعريف الكامل لسياسات CHATS' as section,
    'CREATE POLICY ' || policyname || 
    ' ON ' || schemaname || '.' || tablename ||
    ' AS ' || CASE WHEN permissive = 'PERMISSIVE' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END ||
    ' FOR ' || cmd ||
    ' TO ' || array_to_string(roles, ', ') ||
    COALESCE(' USING (' || qual::text || ')', '') ||
    COALESCE(' WITH CHECK (' || with_check::text || ')', '') ||
    ';' as policy_definition
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'chats'
ORDER BY policyname;

-- 8.2 التعريف الكامل لسياسات MESSAGES
SELECT 
    '🔍 التعريف الكامل لسياسات MESSAGES' as section,
    'CREATE POLICY ' || policyname || 
    ' ON ' || schemaname || '.' || tablename ||
    ' AS ' || CASE WHEN permissive = 'PERMISSIVE' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END ||
    ' FOR ' || cmd ||
    ' TO ' || array_to_string(roles, ', ') ||
    COALESCE(' USING (' || qual::text || ')', '') ||
    COALESCE(' WITH CHECK (' || with_check::text || ')', '') ||
    ';' as policy_definition
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'messages'
ORDER BY policyname;

-- ==================================================
-- ✅ اكتمل فحص السياسات
-- 📌 تأكد من:
-- 1. جميع العمليات لها سياسات
-- 2. السياسات تدعم جميع الأدوار المطلوبة
-- 3. شروط auth.uid() و role صحيحة
-- 4. عدم وجود سياسات متضاربة
-- ==================================================
