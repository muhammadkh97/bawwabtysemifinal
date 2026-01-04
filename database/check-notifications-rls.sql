-- ============================================
-- فحص RLS policies على جدول notifications
-- ============================================

-- 1. فحص هل RLS مفعل
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'notifications';

-- 2. عرض جميع policies على جدول notifications
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
WHERE tablename = 'notifications';
