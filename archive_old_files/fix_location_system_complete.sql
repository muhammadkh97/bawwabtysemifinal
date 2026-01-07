-- =========================================================
-- 🔧 إصلاح شامل لنظام الخرائط والمواقع الجغرافية
-- =========================================================
-- التاريخ: 2026-01-07
-- الهدف: إصلاح وتوحيد أعمدة الموقع في قاعدة البيانات
-- =========================================================

-- =========================================================
-- الخطوة 1: توحيد أعمدة الإحداثيات في جدول stores
-- =========================================================

-- 1.1: التأكد من وجود جميع الأعمدة المطلوبة
DO $$ 
BEGIN
    -- إضافة lat إذا لم يكن موجود
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' AND column_name = 'lat'
    ) THEN
        ALTER TABLE stores ADD COLUMN lat DECIMAL(10, 8);
        RAISE NOTICE '✅ تمت إضافة عمود lat';
    END IF;

    -- إضافة lng إذا لم يكن موجود
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' AND column_name = 'lng'
    ) THEN
        ALTER TABLE stores ADD COLUMN lng DECIMAL(11, 8);
        RAISE NOTICE '✅ تمت إضافة عمود lng';
    END IF;

    -- إضافة latitude إذا لم يكن موجود
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' AND column_name = 'latitude'
    ) THEN
        ALTER TABLE stores ADD COLUMN latitude DECIMAL(10, 8);
        RAISE NOTICE '✅ تمت إضافة عمود latitude';
    END IF;

    -- إضافة longitude إذا لم يكن موجود
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' AND column_name = 'longitude'
    ) THEN
        ALTER TABLE stores ADD COLUMN longitude DECIMAL(11, 8);
        RAISE NOTICE '✅ تمت إضافة عمود longitude';
    END IF;

    -- إضافة location (PostGIS) إذا لم يكن موجود
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stores' AND column_name = 'location'
    ) THEN
        ALTER TABLE stores ADD COLUMN location GEOGRAPHY(POINT, 4326);
        RAISE NOTICE '✅ تمت إضافة عمود location (PostGIS)';
    END IF;
END $$;

-- 1.2: مزامنة البيانات الموجودة (نسخ من latitude/longitude إلى lat/lng)
UPDATE stores
SET 
    lat = COALESCE(lat, latitude),
    lng = COALESCE(lng, longitude)
WHERE (lat IS NULL AND latitude IS NOT NULL)
   OR (lng IS NULL AND longitude IS NOT NULL);

-- 1.3: مزامنة البيانات العكسية (نسخ من lat/lng إلى latitude/longitude)
UPDATE stores
SET 
    latitude = COALESCE(latitude, lat),
    longitude = COALESCE(longitude, lng)
WHERE (latitude IS NULL AND lat IS NOT NULL)
   OR (longitude IS NULL AND lng IS NOT NULL);

-- 1.4: تحديث عمود location (PostGIS) من lat/lng
UPDATE stores
SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326)::GEOGRAPHY
WHERE lat IS NOT NULL 
    AND lng IS NOT NULL
    AND location IS NULL;

-- 1.5: إضافة Constraints للتحقق من صحة الإحداثيات
DO $$
BEGIN
    -- Constraint لخط العرض
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'stores_lat_valid_range'
    ) THEN
        ALTER TABLE stores 
        ADD CONSTRAINT stores_lat_valid_range 
        CHECK (lat IS NULL OR (lat >= -90 AND lat <= 90));
        RAISE NOTICE '✅ تمت إضافة constraint لخط العرض';
    END IF;

    -- Constraint لخط الطول
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'stores_lng_valid_range'
    ) THEN
        ALTER TABLE stores 
        ADD CONSTRAINT stores_lng_valid_range 
        CHECK (lng IS NULL OR (lng >= -180 AND lng <= 180));
        RAISE NOTICE '✅ تمت إضافة constraint لخط الطول';
    END IF;

    -- Constraint لضمان تناسق lat/latitude
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'stores_lat_consistency'
    ) THEN
        ALTER TABLE stores 
        ADD CONSTRAINT stores_lat_consistency 
        CHECK (
            (lat IS NULL AND latitude IS NULL) OR
            (lat IS NOT NULL AND latitude IS NOT NULL AND lat = latitude) OR
            (lat IS NOT NULL AND latitude IS NULL) OR
            (lat IS NULL AND latitude IS NOT NULL)
        );
        RAISE NOTICE '✅ تمت إضافة constraint لتناسق خط العرض';
    END IF;

    -- Constraint لضمان تناسق lng/longitude
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'stores_lng_consistency'
    ) THEN
        ALTER TABLE stores 
        ADD CONSTRAINT stores_lng_consistency 
        CHECK (
            (lng IS NULL AND longitude IS NULL) OR
            (lng IS NOT NULL AND longitude IS NOT NULL AND lng = longitude) OR
            (lng IS NOT NULL AND longitude IS NULL) OR
            (lng IS NULL AND longitude IS NOT NULL)
        );
        RAISE NOTICE '✅ تمت إضافة constraint لتناسق خط الطول';
    END IF;
END $$;

-- 1.6: إنشاء Spatial Index على عمود location
CREATE INDEX IF NOT EXISTS idx_stores_location_gist 
ON stores USING GIST(location);

-- =========================================================
-- الخطوة 2: إصلاح جدول orders (مواقع التوصيل)
-- =========================================================

-- 2.1: التأكد من وجود أعمدة التوصيل
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'delivery_latitude'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivery_latitude DECIMAL(10, 8);
        RAISE NOTICE '✅ تمت إضافة عمود delivery_latitude';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'delivery_longitude'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivery_longitude DECIMAL(11, 8);
        RAISE NOTICE '✅ تمت إضافة عمود delivery_longitude';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'delivery_location'
    ) THEN
        ALTER TABLE orders ADD COLUMN delivery_location GEOGRAPHY(POINT, 4326);
        RAISE NOTICE '✅ تمت إضافة عمود delivery_location';
    END IF;
END $$;

-- 2.2: إضافة Constraints لإحداثيات التوصيل
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_delivery_lat_valid'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT orders_delivery_lat_valid 
        CHECK (delivery_latitude IS NULL OR (delivery_latitude >= -90 AND delivery_latitude <= 90));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'orders_delivery_lng_valid'
    ) THEN
        ALTER TABLE orders 
        ADD CONSTRAINT orders_delivery_lng_valid 
        CHECK (delivery_longitude IS NULL OR (delivery_longitude >= -180 AND delivery_longitude <= 180));
    END IF;
END $$;

-- 2.3: إنشاء Spatial Index على مواقع التوصيل
CREATE INDEX IF NOT EXISTS idx_orders_delivery_location_gist 
ON orders USING GIST(delivery_location);

-- =========================================================
-- الخطوة 3: إصلاح جدول drivers (موقع السائقين)
-- =========================================================

-- 3.1: التأكد من أسماء الأعمدة الصحيحة
-- ملاحظة: من التشخيص وجدنا أن الأعمدة هي current_lat/current_lng وليس current_latitude/current_longitude

DO $$ 
BEGIN
    -- التحقق من وجود current_lat
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'drivers' AND column_name = 'current_lat'
    ) THEN
        ALTER TABLE drivers ADD COLUMN current_lat DECIMAL(10, 8);
        RAISE NOTICE '✅ تمت إضافة عمود current_lat';
    END IF;

    -- التحقق من وجود current_lng
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'drivers' AND column_name = 'current_lng'
    ) THEN
        ALTER TABLE drivers ADD COLUMN current_lng DECIMAL(11, 8);
        RAISE NOTICE '✅ تمت إضافة عمود current_lng';
    END IF;

    -- إضافة current_location
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'drivers' AND column_name = 'current_location'
    ) THEN
        ALTER TABLE drivers ADD COLUMN current_location GEOGRAPHY(POINT, 4326);
        RAISE NOTICE '✅ تمت إضافة عمود current_location';
    END IF;
END $$;

-- 3.2: تحديث current_location من current_lat/current_lng
UPDATE drivers
SET current_location = ST_SetSRID(ST_MakePoint(current_lng, current_lat), 4326)::GEOGRAPHY
WHERE current_lat IS NOT NULL 
    AND current_lng IS NOT NULL
    AND current_location IS NULL;

-- 3.3: إضافة Constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'drivers_current_lat_valid'
    ) THEN
        ALTER TABLE drivers 
        ADD CONSTRAINT drivers_current_lat_valid 
        CHECK (current_lat IS NULL OR (current_lat >= -90 AND current_lat <= 90));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'drivers_current_lng_valid'
    ) THEN
        ALTER TABLE drivers 
        ADD CONSTRAINT drivers_current_lng_valid 
        CHECK (current_lng IS NULL OR (current_lng >= -180 AND current_lng <= 180));
    END IF;
END $$;

-- 3.4: إنشاء Spatial Index على موقع السائقين
CREATE INDEX IF NOT EXISTS idx_drivers_current_location_gist 
ON drivers USING GIST(current_location);

-- =========================================================
-- الخطوة 4: إنشاء Functions لحساب المسافة
-- =========================================================

-- حذف Functions القديمة إذا كانت موجودة
DROP FUNCTION IF EXISTS calculate_distance_km CASCADE;
DROP FUNCTION IF EXISTS get_nearby_stores CASCADE;
DROP FUNCTION IF EXISTS update_driver_location CASCADE;

-- 4.1: Function لحساب المسافة بين نقطتين (بالكيلومتر)
CREATE OR REPLACE FUNCTION calculate_distance_km(
    lat1 DECIMAL,
    lng1 DECIMAL,
    lat2 DECIMAL,
    lng2 DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
    point1 GEOGRAPHY;
    point2 GEOGRAPHY;
BEGIN
    -- إنشاء نقاط جغرافية
    point1 := ST_SetSRID(ST_MakePoint(lng1, lat1), 4326)::GEOGRAPHY;
    point2 := ST_SetSRID(ST_MakePoint(lng2, lat2), 4326)::GEOGRAPHY;
    
    -- حساب المسافة بالمتر وتحويلها لكيلومتر
    RETURN ST_Distance(point1, point2) / 1000;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_distance_km IS 'حساب المسافة بين نقطتين بالكيلومتر';

-- 4.2: Function للبحث عن المتاجر القريبة
CREATE OR REPLACE FUNCTION get_nearby_stores(
    user_lat DECIMAL,
    user_lng DECIMAL,
    radius_km DECIMAL DEFAULT 10
)
RETURNS TABLE(
    store_id UUID,
    store_name VARCHAR,
    distance_km DECIMAL,
    lat DECIMAL,
    lng DECIMAL,
    address TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name::VARCHAR,
        calculate_distance_km(user_lat, user_lng, s.lat, s.lng) as distance_km,
        s.lat,
        s.lng,
        s.address
    FROM stores s
    WHERE s.lat IS NOT NULL 
        AND s.lng IS NOT NULL
        AND s.is_active = true
        AND calculate_distance_km(user_lat, user_lng, s.lat, s.lng) <= radius_km
    ORDER BY distance_km ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_nearby_stores IS 'البحث عن المتاجر القريبة ضمن نصف قطر محدد';

-- 4.3: Function لتحديث موقع السائق
CREATE OR REPLACE FUNCTION update_driver_location(
    driver_id UUID,
    new_lat DECIMAL,
    new_lng DECIMAL
)
RETURNS VOID AS $$
BEGIN
    UPDATE drivers
    SET 
        current_lat = new_lat,
        current_lng = new_lng,
        current_location = ST_SetSRID(ST_MakePoint(new_lng, new_lat), 4326)::GEOGRAPHY,
        location_updated_at = NOW()
    WHERE id = driver_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_driver_location IS 'تحديث موقع السائق الحالي';

-- =========================================================
-- الخطوة 5: إنشاء Triggers للمزامنة التلقائية
-- =========================================================

-- 5.1: Trigger لمزامنة lat/latitude و lng/longitude في stores
CREATE OR REPLACE FUNCTION sync_store_coordinates()
RETURNS TRIGGER AS $$
BEGIN
    -- مزامنة lat <-> latitude
    IF NEW.lat IS NOT NULL THEN
        NEW.latitude := NEW.lat;
    ELSIF NEW.latitude IS NOT NULL THEN
        NEW.lat := NEW.latitude;
    END IF;

    -- مزامنة lng <-> longitude
    IF NEW.lng IS NOT NULL THEN
        NEW.longitude := NEW.lng;
    ELSIF NEW.longitude IS NOT NULL THEN
        NEW.lng := NEW.longitude;
    END IF;

    -- تحديث location من lat/lng
    IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::GEOGRAPHY;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_store_coordinates ON stores;
CREATE TRIGGER trigger_sync_store_coordinates
    BEFORE INSERT OR UPDATE ON stores
    FOR EACH ROW
    EXECUTE FUNCTION sync_store_coordinates();

-- 5.2: Trigger لتحديث delivery_location في orders
CREATE OR REPLACE FUNCTION sync_order_delivery_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.delivery_latitude IS NOT NULL AND NEW.delivery_longitude IS NOT NULL THEN
        NEW.delivery_location := ST_SetSRID(
            ST_MakePoint(NEW.delivery_longitude, NEW.delivery_latitude), 
            4326
        )::GEOGRAPHY;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_order_delivery_location ON orders;
CREATE TRIGGER trigger_sync_order_delivery_location
    BEFORE INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION sync_order_delivery_location();

-- 5.3: Trigger لتحديث current_location في drivers
CREATE OR REPLACE FUNCTION sync_driver_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_lat IS NOT NULL AND NEW.current_lng IS NOT NULL THEN
        NEW.current_location := ST_SetSRID(
            ST_MakePoint(NEW.current_lng, NEW.current_lat), 
            4326
        )::GEOGRAPHY;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_driver_location ON drivers;
CREATE TRIGGER trigger_sync_driver_location
    BEFORE INSERT OR UPDATE ON drivers
    FOR EACH ROW
    EXECUTE FUNCTION sync_driver_location();

-- =========================================================
-- الخطوة 6: تقرير النتائج
-- =========================================================

DO $$ 
DECLARE
    v_stores_count INTEGER;
    v_stores_with_location INTEGER;
    v_orders_count INTEGER;
    v_orders_with_location INTEGER;
    v_drivers_count INTEGER;
    v_drivers_with_location INTEGER;
BEGIN
    -- إحصائيات المتاجر
    SELECT COUNT(*) INTO v_stores_count FROM stores;
    SELECT COUNT(*) INTO v_stores_with_location FROM stores WHERE lat IS NOT NULL AND lng IS NOT NULL;
    
    -- إحصائيات الطلبات
    SELECT COUNT(*) INTO v_orders_count FROM orders;
    SELECT COUNT(*) INTO v_orders_with_location FROM orders WHERE delivery_latitude IS NOT NULL AND delivery_longitude IS NOT NULL;
    
    -- إحصائيات السائقين
    SELECT COUNT(*) INTO v_drivers_count FROM drivers;
    SELECT COUNT(*) INTO v_drivers_with_location FROM drivers WHERE current_lat IS NOT NULL AND current_lng IS NOT NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ اكتمل إصلاح نظام المواقع الجغرافية';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 النتائج:';
    RAISE NOTICE '   المتاجر: %/% لديها موقع', v_stores_with_location, v_stores_count;
    RAISE NOTICE '   الطلبات: %/% لديها موقع توصيل', v_orders_with_location, v_orders_count;
    RAISE NOTICE '   السائقين: %/% لديهم موقع حالي', v_drivers_with_location, v_drivers_count;
    RAISE NOTICE '';
    RAISE NOTICE '✅ ما تم إنجازه:';
    RAISE NOTICE '   ✓ توحيد أعمدة الإحداثيات';
    RAISE NOTICE '   ✓ إضافة Constraints للتحقق من صحة البيانات';
    RAISE NOTICE '   ✓ إنشاء Spatial Indexes لتحسين الأداء';
    RAISE NOTICE '   ✓ إنشاء Functions لحساب المسافة';
    RAISE NOTICE '   ✓ إنشاء Triggers للمزامنة التلقائية';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 الخطوة التالية:';
    RAISE NOTICE '   - أضف مواقع للمتاجر من لوحة التحكم';
    RAISE NOTICE '   - اختبر وظائف البحث عن المتاجر القريبة';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
