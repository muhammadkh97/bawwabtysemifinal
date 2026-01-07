-- =====================================================
-- ⚙️ سكريبت فحص Functions و Triggers لنظام الدردشة
-- Chat System Functions & Triggers Inspection
-- =====================================================
-- التاريخ: 2026-01-06
-- الهدف: فحص جميع الدوال والمحفزات المتعلقة بالدردشة
-- ملاحظة: نسخ كل استعلام وتشغيله في Supabase SQL Editor
-- =====================================================

-- ==================================================
-- 🔧 1. فحص الدوال المتعلقة بالدردشة
-- ==================================================

-- 1.1 البحث عن جميع الدوال التي تحتوي على 'chat' أو 'message'
SELECT 
    '🔧 الدوال المتعلقة بالدردشة' as section,
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type,
    CASE 
        WHEN p.provolatile = 'i' THEN 'IMMUTABLE'
        WHEN p.provolatile = 's' THEN 'STABLE'
        WHEN p.provolatile = 'v' THEN 'VOLATILE'
    END as volatility,
    CASE 
        WHEN p.prosecdef THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security,
    obj_description(p.oid, 'pg_proc') as description
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND (
    p.proname ILIKE '%chat%' 
    OR p.proname ILIKE '%message%'
    OR p.proname ILIKE '%conversation%'
  )
ORDER BY p.proname;

-- ==================================================
-- 📝 2. كود المصدر للدوال
-- ==================================================

-- 2.1 عرض كود المصدر لكل دالة
SELECT 
    '📝 كود المصدر للدوال' as section,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND (
    p.proname ILIKE '%chat%' 
    OR p.proname ILIKE '%message%'
  )
ORDER BY p.proname;

-- ==================================================
-- ⚡ 3. المحفزات على جداول الدردشة
-- ==================================================

-- 3.1 المحفزات على جدول CHATS
SELECT 
    '⚡ المحفزات على جدول CHATS' as section,
    t.tgname as trigger_name,
    CASE t.tgenabled
        WHEN 'O' THEN '✅ مفعل'
        WHEN 'D' THEN '❌ معطل'
        WHEN 'R' THEN '🔄 مفعل للـ Replica'
        WHEN 'A' THEN '⚠️ مفعل دائماً'
        ELSE 'غير معروف'
    END as status,
    CASE t.tgtype::int & 1
        WHEN 1 THEN 'ROW'
        ELSE 'STATEMENT'
    END as level,
    CASE t.tgtype::int & 66
        WHEN 2 THEN 'BEFORE'
        WHEN 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END as timing,
    array_to_string(ARRAY[
        CASE WHEN t.tgtype::int & 4 != 0 THEN 'INSERT' END,
        CASE WHEN t.tgtype::int & 8 != 0 THEN 'DELETE' END,
        CASE WHEN t.tgtype::int & 16 != 0 THEN 'UPDATE' END,
        CASE WHEN t.tgtype::int & 32 != 0 THEN 'TRUNCATE' END
    ]::text[], ' OR ') as events,
    p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE n.nspname = 'public'
  AND c.relname = 'chats'
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- 3.2 المحفزات على جدول MESSAGES
SELECT 
    '⚡ المحفزات على جدول MESSAGES' as section,
    t.tgname as trigger_name,
    CASE t.tgenabled
        WHEN 'O' THEN '✅ مفعل'
        WHEN 'D' THEN '❌ معطل'
        WHEN 'R' THEN '🔄 مفعل للـ Replica'
        WHEN 'A' THEN '⚠️ مفعل دائماً'
        ELSE 'غير معروف'
    END as status,
    CASE t.tgtype::int & 1
        WHEN 1 THEN 'ROW'
        ELSE 'STATEMENT'
    END as level,
    CASE t.tgtype::int & 66
        WHEN 2 THEN 'BEFORE'
        WHEN 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END as timing,
    array_to_string(ARRAY[
        CASE WHEN t.tgtype::int & 4 != 0 THEN 'INSERT' END,
        CASE WHEN t.tgtype::int & 8 != 0 THEN 'DELETE' END,
        CASE WHEN t.tgtype::int & 16 != 0 THEN 'UPDATE' END,
        CASE WHEN t.tgtype::int & 32 != 0 THEN 'TRUNCATE' END
    ]::text[], ' OR ') as events,
    p.proname as function_name
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE n.nspname = 'public'
  AND c.relname = 'messages'
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- ==================================================
-- 📋 4. تعريف المحفزات الكامل
-- ==================================================

-- 4.1 تعريف المحفزات على CHATS
SELECT 
    '📋 تعريف المحفزات على CHATS' as section,
    'CREATE TRIGGER ' || t.tgname ||
    ' ' || CASE t.tgtype::int & 66
        WHEN 2 THEN 'BEFORE'
        WHEN 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END ||
    ' ' || array_to_string(ARRAY[
        CASE WHEN t.tgtype::int & 4 != 0 THEN 'INSERT' END,
        CASE WHEN t.tgtype::int & 8 != 0 THEN 'DELETE' END,
        CASE WHEN t.tgtype::int & 16 != 0 THEN 'UPDATE' END
    ]::text[], ' OR ') ||
    ' ON ' || n.nspname || '.' || c.relname ||
    ' FOR EACH ' || CASE t.tgtype::int & 1
        WHEN 1 THEN 'ROW'
        ELSE 'STATEMENT'
    END ||
    ' EXECUTE FUNCTION ' || p.proname || '();' as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE n.nspname = 'public'
  AND c.relname = 'chats'
  AND NOT t.tgisinternal;

-- 4.2 تعريف المحفزات على MESSAGES
SELECT 
    '📋 تعريف المحفزات على MESSAGES' as section,
    'CREATE TRIGGER ' || t.tgname ||
    ' ' || CASE t.tgtype::int & 66
        WHEN 2 THEN 'BEFORE'
        WHEN 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END ||
    ' ' || array_to_string(ARRAY[
        CASE WHEN t.tgtype::int & 4 != 0 THEN 'INSERT' END,
        CASE WHEN t.tgtype::int & 8 != 0 THEN 'DELETE' END,
        CASE WHEN t.tgtype::int & 16 != 0 THEN 'UPDATE' END
    ]::text[], ' OR ') ||
    ' ON ' || n.nspname || '.' || c.relname ||
    ' FOR EACH ' || CASE t.tgtype::int & 1
        WHEN 1 THEN 'ROW'
        ELSE 'STATEMENT'
    END ||
    ' EXECUTE FUNCTION ' || p.proname || '();' as trigger_definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE n.nspname = 'public'
  AND c.relname = 'messages'
  AND NOT t.tgisinternal;

-- ==================================================
-- 🔍 5. كود الدوال المستخدمة في المحفزات
-- ==================================================

-- 5.1 كود الدوال المستخدمة في محفزات CHATS
SELECT DISTINCT
    '🔍 كود الدوال لمحفزات CHATS' as section,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_code
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE n.nspname = 'public'
  AND c.relname = 'chats'
  AND NOT t.tgisinternal;

-- 5.2 كود الدوال المستخدمة في محفزات MESSAGES
SELECT DISTINCT
    '🔍 كود الدوال لمحفزات MESSAGES' as section,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_code
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE n.nspname = 'public'
  AND c.relname = 'messages'
  AND NOT t.tgisinternal;

-- ==================================================
-- 📊 6. إحصائيات
-- ==================================================

-- 6.1 عدد الدوال والمحفزات
SELECT 
    '📊 إحصائيات الدوال والمحفزات' as section,
    'Functions' as type,
    COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND (p.proname ILIKE '%chat%' OR p.proname ILIKE '%message%')
UNION ALL
SELECT 
    '📊 إحصائيات الدوال والمحفزات',
    'Triggers on chats',
    COUNT(*)
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'chats'
  AND NOT t.tgisinternal
UNION ALL
SELECT 
    '📊 إحصائيات الدوال والمحفزات',
    'Triggers on messages',
    COUNT(*)
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname = 'messages'
  AND NOT t.tgisinternal;

-- ==================================================
-- 🔍 7. الدوال التي تستخدم جداول الدردشة
-- ==================================================

-- 7.1 البحث عن دوال تستخدم جداول chats أو messages
SELECT 
    '🔍 الدوال التي تستخدم جداول الدردشة' as section,
    p.proname as function_name,
    CASE 
        WHEN pg_get_functiondef(p.oid) ILIKE '%FROM chats%' OR 
             pg_get_functiondef(p.oid) ILIKE '%INTO chats%' OR
             pg_get_functiondef(p.oid) ILIKE '%UPDATE chats%' OR
             pg_get_functiondef(p.oid) ILIKE '%DELETE FROM chats%'
        THEN '✅ يستخدم جدول chats'
        ELSE '❌'
    END as uses_chats_table,
    CASE 
        WHEN pg_get_functiondef(p.oid) ILIKE '%FROM messages%' OR 
             pg_get_functiondef(p.oid) ILIKE '%INTO messages%' OR
             pg_get_functiondef(p.oid) ILIKE '%UPDATE messages%' OR
             pg_get_functiondef(p.oid) ILIKE '%DELETE FROM messages%'
        THEN '✅ يستخدم جدول messages'
        ELSE '❌'
    END as uses_messages_table
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND (
    pg_get_functiondef(p.oid) ILIKE '%chats%' OR 
    pg_get_functiondef(p.oid) ILIKE '%messages%'
  )
ORDER BY p.proname;

-- ==================================================
-- 🔐 8. أذونات الدوال
-- ==================================================

-- 8.1 أذونات الدوال المتعلقة بالدردشة
SELECT 
    '🔐 أذونات الدوال' as section,
    p.proname as function_name,
    CASE 
        WHEN p.prosecdef THEN '🔒 SECURITY DEFINER (يعمل بصلاحيات المالك)'
        ELSE '🔓 SECURITY INVOKER (يعمل بصلاحيات المستدعي)'
    END as security_type,
    pg_get_userbyid(p.proowner) as owner,
    CASE p.proacl
        WHEN NULL THEN '⚠️ أذونات افتراضية'
        ELSE '✅ أذونات مخصصة'
    END as permissions
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND (
    p.proname ILIKE '%chat%' 
    OR p.proname ILIKE '%message%'
  )
ORDER BY p.proname;

-- ==================================================
-- ✅ اكتمل فحص الدوال والمحفزات
-- 📌 تحقق من:
-- 1. وجود محفزات لتحديث last_message و updated_at
-- 2. دوال الإشعارات والـ realtime
-- 3. عدم وجود محفزات معطلة
-- 4. راجع SECURITY DEFINER functions بعناية
-- ==================================================
