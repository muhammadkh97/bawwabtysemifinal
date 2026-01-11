-- ============================================
-- سكربت شامل لاستخراج هيكل قاعدة البيانات
-- Database Structure Extraction Script
-- ============================================

-- ============================================
-- 1. استخراج جميع الأنواع المخصصة (Custom Enums)
-- Extract All Custom Enums
-- ============================================
SELECT 
    '=== CUSTOM ENUMS ===' as section,
    n.nspname as schema_name,
    t.typname as enum_name,
    string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
GROUP BY n.nspname, t.typname
ORDER BY t.typname;

-- ============================================
-- 2. استخراج جميع الجداول مع عدد الأعمدة
-- Extract All Tables with Column Count
-- ============================================
SELECT 
    '=== TABLES OVERVIEW ===' as section,
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;

-- ============================================
-- 3. استخراج تفاصيل الأعمدة الكاملة لكل جدول
-- Extract Complete Column Details for Each Table
-- ============================================
SELECT 
    '=== DETAILED COLUMNS ===' as section,
    c.table_name,
    c.column_name,
    c.ordinal_position,
    c.data_type,
    c.udt_name,
    CASE 
        WHEN c.character_maximum_length IS NOT NULL 
        THEN c.data_type || '(' || c.character_maximum_length || ')'
        WHEN c.numeric_precision IS NOT NULL 
        THEN c.data_type || '(' || c.numeric_precision || ',' || c.numeric_scale || ')'
        ELSE c.data_type
    END as full_data_type,
    c.is_nullable,
    c.column_default,
    CASE 
        WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY'
        WHEN fk.column_name IS NOT NULL THEN 'FOREIGN KEY'
        ELSE ''
    END as key_type
FROM information_schema.columns c
LEFT JOIN (
    SELECT ku.table_name, ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku
        ON tc.constraint_name = ku.constraint_name
        AND tc.table_schema = ku.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_schema = 'public'
) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
LEFT JOIN (
    SELECT ku.table_name, ku.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku
        ON tc.constraint_name = ku.constraint_name
        AND tc.table_schema = ku.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
) fk ON c.table_name = fk.table_name AND c.column_name = fk.column_name
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;

-- ============================================
-- 4. استخراج المفاتيح الأساسية (Primary Keys)
-- Extract Primary Keys
-- ============================================
SELECT 
    '=== PRIMARY KEYS ===' as section,
    tc.table_name,
    kcu.column_name,
    kcu.ordinal_position
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.ordinal_position;

-- ============================================
-- 5. استخراج المفاتيح الأجنبية (Foreign Keys)
-- Extract Foreign Keys and Relationships
-- ============================================
SELECT 
    '=== FOREIGN KEYS ===' as section,
    tc.table_name as from_table,
    kcu.column_name as from_column,
    ccu.table_name as to_table,
    ccu.column_name as to_column,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- 6. استخراج الفهارس (Indexes)
-- Extract Indexes
-- ============================================
SELECT 
    '=== INDEXES ===' as section,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================
-- 7. استخراج القيود الفريدة (Unique Constraints)
-- Extract Unique Constraints
-- ============================================
SELECT 
    '=== UNIQUE CONSTRAINTS ===' as section,
    tc.table_name,
    kcu.column_name,
    tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- 8. ملخص شامل للجدول مع جميع التفاصيل
-- Comprehensive Table Summary (JSON Format)
-- ============================================
SELECT 
    '=== COMPREHENSIVE SUMMARY ===' as section,
    json_build_object(
        'table_name', c.table_name,
        'columns', json_agg(
            json_build_object(
                'name', c.column_name,
                'position', c.ordinal_position,
                'type', c.udt_name,
                'data_type', c.data_type,
                'nullable', c.is_nullable,
                'default', c.column_default
            ) ORDER BY c.ordinal_position
        )
    ) as table_structure
FROM information_schema.columns c
WHERE c.table_schema = 'public'
GROUP BY c.table_name
ORDER BY c.table_name;

-- ============================================
-- 9. عرض بسيط وسهل النسخ لجميع الجداول والأعمدة
-- Simple Copy-Friendly View of All Tables and Columns
-- ============================================
SELECT 
    '=== SIMPLE FORMAT ===' as section,
    c.table_name || '.' || c.column_name as full_column_name,
    c.udt_name as type,
    c.is_nullable as nullable,
    COALESCE(c.column_default, 'NULL') as default_value
FROM information_schema.columns c
WHERE c.table_schema = 'public'
ORDER BY c.table_name, c.ordinal_position;

-- ============================================
-- 10. إحصائيات قاعدة البيانات
-- Database Statistics
-- ============================================
SELECT 
    '=== DATABASE STATISTICS ===' as section,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public') as total_columns,
    (SELECT COUNT(DISTINCT typname) FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE n.nspname = 'public' AND EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = t.oid)) as total_enums;

-- ============================================
-- 11. استخراج سياسات RLS (Row Level Security)
-- Extract RLS Policies
-- ============================================
SELECT 
    '=== RLS POLICIES ===' as section,
    schemaname as schema_name,
    tablename as table_name,
    policyname as policy_name,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 12. عرض مفصل لسياسات RLS
-- Detailed RLS Policies View
-- ============================================
SELECT 
    '=== RLS POLICIES DETAILED ===' as section,
    tablename as table_name,
    policyname as policy_name,
    CASE 
        WHEN cmd = 'r' THEN 'SELECT'
        WHEN cmd = 'a' THEN 'INSERT'
        WHEN cmd = 'w' THEN 'UPDATE'
        WHEN cmd = 'd' THEN 'DELETE'
        WHEN cmd = '*' THEN 'ALL'
        ELSE cmd::text
    END as operation,
    CASE 
        WHEN permissive = 'PERMISSIVE' THEN 'مسموح (PERMISSIVE)'
        ELSE 'مقيد (RESTRICTIVE)'
    END as policy_type,
    array_to_string(roles, ', ') as applicable_roles,
    COALESCE(qual, 'لا يوجد') as using_condition,
    COALESCE(with_check, 'لا يوجد') as with_check_condition
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 13. إحصائيات سياسات RLS
-- RLS Policies Statistics
-- ============================================
SELECT 
    '=== RLS STATISTICS ===' as section,
    COUNT(DISTINCT tablename) as tables_with_rls,
    COUNT(*) as total_policies,
    COUNT(*) FILTER (WHERE cmd = 'r') as select_policies,
    COUNT(*) FILTER (WHERE cmd = 'a') as insert_policies,
    COUNT(*) FILTER (WHERE cmd = 'w') as update_policies,
    COUNT(*) FILTER (WHERE cmd = 'd') as delete_policies,
    COUNT(*) FILTER (WHERE cmd = '*') as all_operation_policies
FROM pg_policies
WHERE schemaname = 'public';

-- ============================================
-- 14. الجداول بدون سياسات RLS
-- Tables Without RLS Policies
-- ============================================
SELECT 
    '=== TABLES WITHOUT RLS ===' as section,
    t.table_name,
    'لا توجد سياسات RLS' as status
FROM information_schema.tables t
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND NOT EXISTS (
        SELECT 1 
        FROM pg_policies p 
        WHERE p.schemaname = 'public' 
        AND p.tablename = t.table_name
    )
ORDER BY t.table_name;

-- ============================================
-- 15. استخراج كود المصدر للوظائف (Functions)
-- Extract Functions Source Code
-- ============================================
SELECT 
    '=== FUNCTIONS SOURCE CODE ===' as section,
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type,
    CASE p.provolatile
        WHEN 'i' THEN 'IMMUTABLE'
        WHEN 's' THEN 'STABLE'
        WHEN 'v' THEN 'VOLATILE'
    END as volatility,
    CASE p.prosecdef
        WHEN true THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security_type,
    l.lanname as language,
    pg_get_functiondef(p.oid) as complete_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f'  -- Functions only (not procedures)
ORDER BY p.proname;

-- ============================================
-- 16. عرض مبسط للوظائف (Functions Summary)
-- Functions Summary
-- ============================================
SELECT 
    '=== FUNCTIONS SUMMARY ===' as section,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type,
    l.lanname as language,
    obj_description(p.oid, 'pg_proc') as description
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f'
ORDER BY p.proname;

-- ============================================
-- 17. استخراج الـ Triggers مع الكود الكامل
-- Extract Triggers with Complete Code
-- ============================================
SELECT 
    '=== TRIGGERS SOURCE CODE ===' as section,
    t.tgname as trigger_name,
    c.relname as table_name,
    CASE t.tgtype & 1
        WHEN 1 THEN 'ROW'
        ELSE 'STATEMENT'
    END as trigger_level,
    CASE t.tgtype & 66
        WHEN 2 THEN 'BEFORE'
        WHEN 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END as trigger_timing,
    ARRAY_TO_STRING(ARRAY[
        CASE WHEN t.tgtype & 4 <> 0 THEN 'INSERT' END,
        CASE WHEN t.tgtype & 8 <> 0 THEN 'DELETE' END,
        CASE WHEN t.tgtype & 16 <> 0 THEN 'UPDATE' END,
        CASE WHEN t.tgtype & 32 <> 0 THEN 'TRUNCATE' END
    ]::text[], ' OR ') as trigger_event,
    p.proname as function_name,
    pg_get_triggerdef(t.oid, true) as trigger_definition,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'public'
    AND NOT t.tgisinternal  -- Exclude internal triggers
ORDER BY c.relname, t.tgname;

-- ============================================
-- 18. عرض مبسط للـ Triggers
-- Triggers Summary
-- ============================================
SELECT 
    '=== TRIGGERS SUMMARY ===' as section,
    c.relname as table_name,
    t.tgname as trigger_name,
    CASE t.tgtype & 66
        WHEN 2 THEN 'BEFORE'
        WHEN 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END as timing,
    ARRAY_TO_STRING(ARRAY[
        CASE WHEN t.tgtype & 4 <> 0 THEN 'INSERT' END,
        CASE WHEN t.tgtype & 8 <> 0 THEN 'DELETE' END,
        CASE WHEN t.tgtype & 16 <> 0 THEN 'UPDATE' END
    ]::text[], ', ') as events,
    p.proname as executes_function,
    CASE t.tgenabled
        WHEN 'O' THEN 'مفعّل (ENABLED)'
        WHEN 'D' THEN 'معطّل (DISABLED)'
        WHEN 'R' THEN 'REPLICA'
        WHEN 'A' THEN 'ALWAYS'
    END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE n.nspname = 'public'
    AND NOT t.tgisinternal
ORDER BY c.relname, t.tgname;

-- ============================================
-- 19. إحصائيات Functions و Triggers
-- Functions and Triggers Statistics
-- ============================================
SELECT 
    '=== FUNCTIONS & TRIGGERS STATISTICS ===' as section,
    (SELECT COUNT(*) FROM pg_proc p 
     JOIN pg_namespace n ON p.pronamespace = n.oid 
     WHERE n.nspname = 'public' AND p.prokind = 'f') as total_functions,
    (SELECT COUNT(*) FROM pg_trigger t 
     JOIN pg_class c ON t.tgrelid = c.oid 
     JOIN pg_namespace n ON c.relnamespace = n.oid 
     WHERE n.nspname = 'public' AND NOT t.tgisinternal) as total_triggers,
    (SELECT COUNT(DISTINCT c.relname) FROM pg_trigger t 
     JOIN pg_class c ON t.tgrelid = c.oid 
     JOIN pg_namespace n ON c.relnamespace = n.oid 
     WHERE n.nspname = 'public' AND NOT t.tgisinternal) as tables_with_triggers;

-- ============================================
-- 20. استخراج كود SQL لإعادة إنشاء Functions
-- Generate CREATE FUNCTION Statements
-- ============================================
SELECT 
    '=== CREATE FUNCTION STATEMENTS ===' as section,
    p.proname as function_name,
    'DROP FUNCTION IF EXISTS ' || n.nspname || '.' || p.proname || 
    '(' || pg_get_function_identity_arguments(p.oid) || ') CASCADE;' || E'\n' ||
    pg_get_functiondef(p.oid) || ';' as recreate_statement
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
    AND p.prokind = 'f'
ORDER BY p.proname;
