-- ===================================================================
-- فحص جدول user_locations
-- ===================================================================

SELECT 
    '📍 أعمدة جدول USER_LOCATIONS:' as info;

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
    AND table_name = 'user_locations'
ORDER BY ordinal_position;

-- ===================================================================

SELECT 
    '🔍 التحقق من أعمدة محددة في جدول USER_LOCATIONS:' as info;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
                AND table_name = 'user_locations' 
                AND column_name = 'apartment'
        ) THEN '✅ موجود'
        ELSE '❌ غير موجود'
    END as "عمود apartment",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
                AND table_name = 'user_locations' 
                AND column_name = 'floor'
        ) THEN '✅ موجود'
        ELSE '❌ غير موجود'
    END as "عمود floor",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
                AND table_name = 'user_locations' 
                AND column_name = 'street'
        ) THEN '✅ موجود'
        ELSE '❌ غير موجود'
    END as "عمود street",
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
                AND table_name = 'user_locations' 
                AND column_name = 'building'
        ) THEN '✅ موجود'
        ELSE '❌ غير موجود'
    END as "عمود building";

-- ===================================================================
