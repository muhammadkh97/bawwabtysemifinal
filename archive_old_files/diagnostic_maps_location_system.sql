-- =========================================================
-- 🗺️ فحص شامل لنظام الخرائط والمواقع الجغرافية
-- =========================================================
-- التاريخ: 2026-01-07
-- الهدف: تشخيص كامل لنظام الموقع في قاعدة البيانات والجداول
-- =========================================================

SELECT '=========================================' as info;
SELECT '🗺️ فحص نظام الخرائط والموقع الجغرافي' as info;
SELECT '=========================================' as info;

-- =========================================================
-- 1️⃣ فحص Extensions المطلوبة للخرائط
-- =========================================================

SELECT '1️⃣ === Extensions الجغرافية ===' as info;

SELECT 
    extname as extension_name,
    extversion as version,
    CASE 
        WHEN extname = 'postgis' THEN '✅ PostGIS للمواقع الجغرافية'
        WHEN extname = 'postgis_topology' THEN '✅ Topology للعلاقات المكانية'
        WHEN extname = 'earthdistance' THEN '✅ حساب المسافات على الأرض'
        ELSE '⚠️ غير معروف'
    END as description
FROM pg_extension
WHERE extname IN ('postgis', 'postgis_topology', 'earthdistance', 'cube')
ORDER BY extname;

SELECT 'التحقق من Extensions المفقودة:' as info;
SELECT 
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') 
        THEN '❌ PostGIS غير مثبت - مطلوب للمواقع الجغرافية'
        ELSE '✅ PostGIS مثبت'
    END as postgis_status;

-- =========================================================
-- 2️⃣ فحص جدول stores - أعمدة الموقع
-- =========================================================

SELECT '2️⃣ === أعمدة الموقع في جدول stores ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name IN ('lat', 'latitude') THEN 'خط العرض (Latitude)'
        WHEN column_name IN ('lng', 'longitude') THEN 'خط الطول (Longitude)'
        WHEN column_name = 'location' THEN 'نقطة جغرافية (PostGIS GEOGRAPHY)'
        WHEN column_name = 'address' THEN 'العنوان النصي'
        ELSE '-'
    END as description
FROM information_schema.columns
WHERE table_name = 'stores' 
    AND column_name IN ('lat', 'latitude', 'lng', 'longitude', 'location', 'address')
ORDER BY ordinal_position;

-- =========================================================
-- 3️⃣ إحصائيات البيانات الجغرافية في stores
-- =========================================================

SELECT '3️⃣ === إحصائيات البيانات الجغرافية - stores ===' as info;

SELECT 
    '📊 إجمالي المتاجر' as indicator,
    COUNT(*) as count
FROM stores
UNION ALL
SELECT 
    '✅ متاجر لديها lat/lng',
    COUNT(*)
FROM stores
WHERE lat IS NOT NULL AND lng IS NOT NULL
UNION ALL
SELECT 
    '✅ متاجر لديها latitude/longitude',
    COUNT(*)
FROM stores
WHERE latitude IS NOT NULL AND longitude IS NOT NULL
UNION ALL
SELECT 
    '✅ متاجر لديها location (PostGIS)',
    COUNT(*)
FROM stores
WHERE location IS NOT NULL
UNION ALL
SELECT 
    '✅ متاجر لديها عنوان نصي',
    COUNT(*)
FROM stores
WHERE address IS NOT NULL AND address != ''
UNION ALL
SELECT 
    '❌ متاجر بدون أي موقع',
    COUNT(*)
FROM stores
WHERE (lat IS NULL OR lng IS NULL) 
    AND (latitude IS NULL OR longitude IS NULL)
    AND location IS NULL;

-- =========================================================
-- 4️⃣ عينة من بيانات المواقع
-- =========================================================

SELECT '4️⃣ === عينة من بيانات المواقع (أول 5 متاجر) ===' as info;

SELECT 
    id,
    LEFT(name, 30) as store_name,
    lat,
    latitude,
    lng,
    longitude,
    CASE 
        WHEN location IS NOT NULL THEN '✅ موجود'
        ELSE '❌ فارغ'
    END as location_postgis,
    LEFT(address, 40) as address
FROM stores
ORDER BY created_at DESC
LIMIT 5;

-- =========================================================
-- 5️⃣ فحص جدول users - موقع المستخدمين
-- =========================================================

SELECT '5️⃣ === أعمدة الموقع في جدول users ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
    AND (
        column_name ILIKE '%lat%' OR 
        column_name ILIKE '%lng%' OR 
        column_name ILIKE '%location%' OR
        column_name ILIKE '%address%' OR
        column_name ILIKE '%coord%'
    )
ORDER BY ordinal_position;

SELECT '📊 إحصائيات مواقع المستخدمين:' as info;

SELECT 
    '📊 إجمالي المستخدمين' as indicator,
    COUNT(*) as count
FROM users;

-- =========================================================
-- 6️⃣ فحص جدول orders - مواقع التوصيل
-- =========================================================

SELECT '6️⃣ === أعمدة الموقع في جدول orders ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'orders' 
    AND (
        column_name ILIKE '%delivery%' AND (
            column_name ILIKE '%lat%' OR 
            column_name ILIKE '%lng%' OR 
            column_name ILIKE '%location%' OR
            column_name ILIKE '%address%'
        )
    )
ORDER BY ordinal_position;

SELECT '📊 إحصائيات مواقع التوصيل:' as info;

SELECT 
    '📊 إجمالي الطلبات' as indicator,
    COUNT(*) as count
FROM orders
UNION ALL
SELECT 
    '✅ طلبات لديها عنوان توصيل',
    COUNT(*)
FROM orders
WHERE delivery_address IS NOT NULL AND delivery_address != ''
UNION ALL
SELECT 
    '✅ طلبات لديها إحداثيات توصيل',
    COUNT(*)
FROM orders
WHERE delivery_latitude IS NOT NULL AND delivery_longitude IS NOT NULL;

-- =========================================================
-- 7️⃣ فحص جدول drivers - موقع السائقين
-- =========================================================

SELECT '7️⃣ === أعمدة الموقع في جدول drivers ===' as info;

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'drivers' 
    AND (
        column_name ILIKE '%lat%' OR 
        column_name ILIKE '%lng%' OR 
        column_name ILIKE '%location%' OR
        column_name ILIKE '%coord%'
    )
ORDER BY ordinal_position;

SELECT '📊 إحصائيات مواقع السائقين:' as info;

SELECT 
    '📊 إجمالي السائقين' as indicator,
    COUNT(*) as count
FROM drivers
UNION ALL
SELECT 
    '✅ سائقين لديهم موقع حالي',
    COUNT(*)
FROM drivers
WHERE current_latitude IS NOT NULL AND current_longitude IS NOT NULL;

-- =========================================================
-- 8️⃣ فحص Indexes على أعمدة الموقع
-- =========================================================

SELECT '8️⃣ === Indexes على أعمدة الموقع ===' as info;

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE (
    indexdef ILIKE '%location%' OR
    indexdef ILIKE '%lat%' OR
    indexdef ILIKE '%lng%' OR
    indexdef ILIKE '%gist%'
)
AND schemaname = 'public'
ORDER BY tablename, indexname;

-- =========================================================
-- 9️⃣ فحص Functions المتعلقة بالمواقع
-- =========================================================

SELECT '9️⃣ === Functions الجغرافية الموجودة ===' as info;

SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE (
    routine_name ILIKE '%distance%' OR
    routine_name ILIKE '%location%' OR
    routine_name ILIKE '%nearby%' OR
    routine_name ILIKE '%radius%'
)
AND routine_schema = 'public'
ORDER BY routine_name;

-- =========================================================
-- 🔟 التحقق من صحة البيانات الجغرافية
-- =========================================================

SELECT '🔟 === التحقق من صحة الإحداثيات ===' as info;

SELECT 'متاجر بإحداثيات غير صحيحة (خارج النطاق):' as info;

SELECT 
    id,
    name as store_name,
    lat,
    lng,
    CASE 
        WHEN lat IS NOT NULL AND (lat < -90 OR lat > 90) THEN '❌ lat خارج النطاق'
        WHEN lng IS NOT NULL AND (lng < -180 OR lng > 180) THEN '❌ lng خارج النطاق'
        ELSE '✅ صحيح'
    END as status
FROM stores
WHERE (lat IS NOT NULL AND (lat < -90 OR lat > 90))
   OR (lng IS NOT NULL AND (lng < -180 OR lng > 180))
LIMIT 10;

SELECT 'متاجر لديها تناقض في الأعمدة (lat/latitude أو lng/longitude):' as info;

SELECT 
    id,
    name as store_name,
    lat,
    latitude,
    lng,
    longitude
FROM stores
WHERE (
    (lat IS NOT NULL AND latitude IS NOT NULL AND lat != latitude)
    OR
    (lng IS NOT NULL AND longitude IS NOT NULL AND lng != longitude)
)
LIMIT 10;

-- =========================================================
-- 1️⃣1️⃣ فحص Constraints على أعمدة الموقع
-- =========================================================

SELECT '1️⃣1️⃣ === Constraints على الإحداثيات ===' as info;

SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
    AND (
        tc.constraint_name ILIKE '%lat%' OR
        tc.constraint_name ILIKE '%lng%' OR
        tc.constraint_name ILIKE '%coord%' OR
        tc.constraint_name ILIKE '%location%'
    )
ORDER BY tc.table_name;

-- =========================================================
-- 1️⃣2️⃣ ملخص المشاكل والتوصيات
-- =========================================================

SELECT '=========================================' as info;
SELECT '📋 ملخص التشخيص' as info;
SELECT '=========================================' as info;

DO $$ 
DECLARE
    v_stores_without_location INTEGER;
    v_stores_with_inconsistent_coords INTEGER;
    v_postgis_installed BOOLEAN;
    v_spatial_index_count INTEGER;
BEGIN
    -- حساب المتاجر بدون موقع
    SELECT COUNT(*) INTO v_stores_without_location
    FROM stores
    WHERE (lat IS NULL OR lng IS NULL) 
        AND (latitude IS NULL OR longitude IS NULL)
        AND location IS NULL;
    
    -- حساب المتاجر بإحداثيات متناقضة
    SELECT COUNT(*) INTO v_stores_with_inconsistent_coords
    FROM stores
    WHERE (lat IS NOT NULL AND latitude IS NOT NULL AND lat != latitude)
       OR (lng IS NOT NULL AND longitude IS NOT NULL AND lng != longitude);
    
    -- التحقق من PostGIS
    SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'postgis') 
    INTO v_postgis_installed;
    
    -- عد Spatial Indexes
    SELECT COUNT(*) INTO v_spatial_index_count
    FROM pg_indexes
    WHERE indexdef ILIKE '%gist%' AND schemaname = 'public';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '🗺️ ملخص نظام المواقع الجغرافية';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 الإحصائيات:';
    RAISE NOTICE '   - متاجر بدون موقع: %', v_stores_without_location;
    RAISE NOTICE '   - متاجر بإحداثيات متناقضة: %', v_stores_with_inconsistent_coords;
    RAISE NOTICE '   - PostGIS مثبت: %', CASE WHEN v_postgis_installed THEN '✅ نعم' ELSE '❌ لا' END;
    RAISE NOTICE '   - عدد Spatial Indexes: %', v_spatial_index_count;
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ المشاكل المكتشفة:';
    
    IF v_stores_without_location > 0 THEN
        RAISE NOTICE '   ❌ % متجر بدون بيانات موقع', v_stores_without_location;
    END IF;
    
    IF v_stores_with_inconsistent_coords > 0 THEN
        RAISE NOTICE '   ❌ % متجر لديه إحداثيات متناقضة', v_stores_with_inconsistent_coords;
    END IF;
    
    IF NOT v_postgis_installed THEN
        RAISE NOTICE '   ❌ PostGIS غير مثبت - مطلوب للبحث الجغرافي المتقدم';
    END IF;
    
    IF v_spatial_index_count = 0 THEN
        RAISE NOTICE '   ⚠️ لا يوجد Spatial Indexes - قد يؤثر على الأداء';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ التوصيات:';
    
    IF v_stores_without_location > 0 THEN
        RAISE NOTICE '   1. إضافة مواقع للمتاجر الفارغة';
    END IF;
    
    IF v_stores_with_inconsistent_coords > 0 THEN
        RAISE NOTICE '   2. توحيد أعمدة الإحداثيات (lat/latitude و lng/longitude)';
    END IF;
    
    IF NOT v_postgis_installed THEN
        RAISE NOTICE '   3. تثبيت PostGIS Extension';
    END IF;
    
    IF v_spatial_index_count = 0 THEN
        RAISE NOTICE '   4. إنشاء GIST Index على عمود location';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
