-- ===================================================================
-- فحص Storage Bucket للصور الشخصية
-- ===================================================================

SELECT 
    '🗄️ فحص Storage Buckets:' as info;

-- عرض جميع الـ buckets
SELECT 
    id as "ID",
    name as "اسم Bucket",
    public as "عام؟",
    created_at as "تاريخ الإنشاء"
FROM storage.buckets
ORDER BY name;

-- ===================================================================

SELECT 
    '🔍 التحقق من وجود bucket avatars:' as info;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM storage.buckets 
            WHERE name = 'avatars'
        ) THEN '✅ موجود'
        ELSE '❌ غير موجود - يجب إنشاؤه'
    END as "bucket avatars";

-- ===================================================================
