-- ===================================================================
-- فحص سياسات RLS على bucket profiles
-- ===================================================================

SELECT 
    '🔐 سياسات Storage على bucket profiles:' as info;

-- عرض جميع السياسات على storage.objects للـ bucket profiles
SELECT 
    schemaname as "Schema",
    tablename as "الجدول",
    policyname as "اسم السياسة",
    permissive as "نوع السياسة",
    roles as "الأدوار",
    cmd as "الأمر",
    qual as "شرط USING"
FROM pg_policies
WHERE schemaname = 'storage' 
    AND tablename = 'objects'
ORDER BY policyname;

-- ===================================================================

SELECT 
    '🔍 عدد السياسات على storage.objects:' as info;

SELECT 
    COUNT(*) as "عدد السياسات"
FROM pg_policies
WHERE schemaname = 'storage' 
    AND tablename = 'objects';

-- ===================================================================
