-- ===================================================================
-- سكريبت فحص شامل لقاعدة البيانات
-- يعرض الجداول والأعمدة وأنواعها وسياسات RLS
-- ===================================================================

-- 1. عرض جميع الجداول في schema public
SELECT 
    '🗄️ الجداول الموجودة في قاعدة البيانات:' as info;

SELECT 
    schemaname as "Schema",
    tablename as "اسم الجدول",
    CASE 
        WHEN rowsecurity THEN '✅ مفعّل'
        ELSE '❌ غير مفعّل'
    END as "RLS مفعّل؟"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ===================================================================

-- 2. عرض تفاصيل أعمدة جدول users
SELECT 
    '📊 أعمدة جدول USERS:' as info;

SELECT 
    column_name as "اسم العمود",
    data_type as "نوع البيانات",
    character_maximum_length as "الطول الأقصى",
    CASE 
        WHEN is_nullable = 'YES' THEN '✅ نعم'
        ELSE '❌ لا'
    END as "يقبل NULL؟",
    column_default as "القيمة الافتراضية"
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'users'
ORDER BY ordinal_position;

-- ===================================================================

-- 3. عرض تفاصيل أعمدة جدول products
SELECT 
    '📦 أعمدة جدول PRODUCTS:' as info;

SELECT 
    column_name as "اسم العمود",
    data_type as "نوع البيانات",
    character_maximum_length as "الطول الأقصى",
    CASE 
        WHEN is_nullable = 'YES' THEN '✅ نعم'
        ELSE '❌ لا'
    END as "يقبل NULL؟"
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'products'
ORDER BY ordinal_position;

-- ===================================================================

-- 4. عرض تفاصيل أعمدة جدول categories
SELECT 
    '🏷️ أعمدة جدول CATEGORIES:' as info;

SELECT 
    column_name as "اسم العمود",
    data_type as "نوع البيانات",
    character_maximum_length as "الطول الأقصى",
    CASE 
        WHEN is_nullable = 'YES' THEN '✅ نعم'
        ELSE '❌ لا'
    END as "يقبل NULL؟"
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'categories'
ORDER BY ordinal_position;

-- ===================================================================

-- 5. عرض تفاصيل أعمدة جدول orders
SELECT 
    '🛒 أعمدة جدول ORDERS:' as info;

SELECT 
    column_name as "اسم العمود",
    data_type as "نوع البيانات",
    CASE 
        WHEN is_nullable = 'YES' THEN '✅ نعم'
        ELSE '❌ لا'
    END as "يقبل NULL؟"
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'orders'
ORDER BY ordinal_position;

-- ===================================================================

-- 6. عرض تفاصيل أعمدة جدول addresses
SELECT 
    '📍 أعمدة جدول ADDRESSES:' as info;

SELECT 
    column_name as "اسم العمود",
    data_type as "نوع البيانات",
    CASE 
        WHEN is_nullable = 'YES' THEN '✅ نعم'
        ELSE '❌ لا'
    END as "يقبل NULL؟"
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'addresses'
ORDER BY ordinal_position;

-- ===================================================================

-- 7. عرض تفاصيل أعمدة جدول vendors
SELECT 
    '🏪 أعمدة جدول VENDORS:' as info;

SELECT 
    column_name as "اسم العمود",
    data_type as "نوع البيانات",
    CASE 
        WHEN is_nullable = 'YES' THEN '✅ نعم'
        ELSE '❌ لا'
    END as "يقبل NULL؟"
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'vendors'
ORDER BY ordinal_position;

-- ===================================================================

-- 8. عرض جميع سياسات RLS على جدول users
SELECT 
    '🔐 سياسات RLS لجدول USERS:' as info;

SELECT 
    schemaname as "Schema",
    tablename as "الجدول",
    policyname as "اسم السياسة",
    permissive as "نوع السياسة",
    roles as "الأدوار",
    cmd as "الأمر",
    qual as "شرط USING",
    with_check as "شرط WITH CHECK"
FROM pg_policies
WHERE schemaname = 'public' 
    AND tablename = 'users'
ORDER BY policyname;

-- ===================================================================

-- 9. عرض جميع سياسات RLS على جدول products
SELECT 
    '🔐 سياسات RLS لجدول PRODUCTS:' as info;

SELECT 
    schemaname as "Schema",
    tablename as "الجدول",
    policyname as "اسم السياسة",
    permissive as "نوع السياسة",
    roles as "الأدوار",
    cmd as "الأمر"
FROM pg_policies
WHERE schemaname = 'public' 
    AND tablename = 'products'
ORDER BY policyname;

-- ===================================================================

-- 10. عرض جميع سياسات RLS على جدول categories
SELECT 
    '🔐 سياسات RLS لجدول CATEGORIES:' as info;

SELECT 
    schemaname as "Schema",
    tablename as "الجدول",
    policyname as "اسم السياسة",
    permissive as "نوع السياسة",
    roles as "الأدوار",
    cmd as "الأمر"
FROM pg_policies
WHERE schemaname = 'public' 
    AND tablename = 'categories'
ORDER BY policyname;

-- ===================================================================

-- 11. عرض جميع سياسات RLS على جدول orders
SELECT 
    '🔐 سياسات RLS لجدول ORDERS:' as info;

SELECT 
    schemaname as "Schema",
    tablename as "الجدول",
    policyname as "اسم السياسة",
    permissive as "نوع السياسة",
    roles as "الأدوار",
    cmd as "الأمر"
FROM pg_policies
WHERE schemaname = 'public' 
    AND tablename = 'orders'
ORDER BY policyname;

-- ===================================================================

-- 12. عرض جميع سياسات RLS على جدول addresses
SELECT 
    '🔐 سياسات RLS لجدول ADDRESSES:' as info;

SELECT 
    schemaname as "Schema",
    tablename as "الجدول",
    policyname as "اسم السياسة",
    permissive as "نوع السياسة",
    roles as "الأدوار",
    cmd as "الأمر"
FROM pg_policies
WHERE schemaname = 'public' 
    AND tablename = 'addresses'
ORDER BY policyname;

-- ===================================================================

-- 13. عرض جميع سياسات RLS على جدول vendors
SELECT 
    '🔐 سياسات RLS لجدول VENDORS:' as info;

SELECT 
    schemaname as "Schema",
    tablename as "الجدول",
    policyname as "اسم السياسة",
    permissive as "نوع السياسة",
    roles as "الأدوار",
    cmd as "الأمر"
FROM pg_policies
WHERE schemaname = 'public' 
    AND tablename = 'vendors'
ORDER BY policyname;

-- ===================================================================

-- 14. التحقق من وجود أعمدة معينة في جدول users
SELECT 
    '🔍 التحقق من أعمدة محددة في جدول USERS:' as info;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
                AND table_name = 'users' 
                AND column_name = 'city'
        ) THEN '✅ موجود'
        ELSE '❌ غير موجود'
    END as "عمود city",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
                AND table_name = 'users' 
                AND column_name = 'country'
        ) THEN '✅ موجود'
        ELSE '❌ غير موجود'
    END as "عمود country",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
                AND table_name = 'users' 
                AND column_name = 'gender'
        ) THEN '✅ موجود'
        ELSE '❌ غير موجود'
    END as "عمود gender",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
                AND table_name = 'users' 
                AND column_name = 'date_of_birth'
        ) THEN '✅ موجود'
        ELSE '❌ غير موجود'
    END as "عمود date_of_birth";

-- ===================================================================

-- 15. عرض ملخص نهائي
SELECT 
    '📋 ملخص الفحص:' as info;

SELECT 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as "عدد الجداول",
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users') as "أعمدة users",
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as "عدد سياسات RLS";

-- ===================================================================
-- ✅ انتهى الفحص - يرجى نسخ جميع النتائج
-- ===================================================================
