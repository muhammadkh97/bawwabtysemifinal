-- =====================================================
-- 🚀 نظام التوصيل المزدوج - Migration الرئيسي
-- Dual Delivery System - Main Migration
-- =====================================================
-- التاريخ: 2026-01-06
-- الإصدار: 1.0
-- =====================================================

-- ==================================================
-- 📋 الجزء 1: إنشاء ENUM Types
-- ==================================================

-- 1️⃣ ENUM لنوع التوصيل
DO $$ BEGIN
    CREATE TYPE delivery_type AS ENUM ('instant', 'scheduled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2️⃣ ENUM لحالة البكج
DO $$ BEGIN
    CREATE TYPE batch_status AS ENUM (
        'collecting',      -- جمع الطلبات
        'ready',           -- جاهز للتعيين
        'assigned',        -- تم تعيين سائق
        'in_transit',      -- قيد التوصيل
        'completed',       -- مكتمل
        'cancelled'        -- ملغي
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==================================================
-- 📋 الجزء 2: إنشاء جدول المناطق
-- ==================================================

-- 3️⃣ جدول delivery_zones
CREATE TABLE IF NOT EXISTS delivery_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    name_ar VARCHAR(100) NOT NULL,
    governorate VARCHAR(100),
    cities TEXT[] NOT NULL DEFAULT '{}',
    polygon JSONB,
    center_lat DECIMAL(10, 8),
    center_lng DECIMAL(11, 8),
    radius_km INTEGER DEFAULT 5,
    delivery_fee DECIMAL(10, 2) NOT NULL DEFAULT 0,
    estimated_days INTEGER NOT NULL DEFAULT 3,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إضافة أعمدة للجدول الموجود إذا لم تكن موجودة
DO $$ BEGIN
    ALTER TABLE delivery_zones ADD COLUMN IF NOT EXISTS governorate VARCHAR(100);
    ALTER TABLE delivery_zones ADD COLUMN IF NOT EXISTS polygon JSONB;
    ALTER TABLE delivery_zones ADD COLUMN IF NOT EXISTS center_lat DECIMAL(10, 8);
    ALTER TABLE delivery_zones ADD COLUMN IF NOT EXISTS center_lng DECIMAL(11, 8);
    ALTER TABLE delivery_zones ADD COLUMN IF NOT EXISTS radius_km INTEGER DEFAULT 5;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_delivery_zones_active ON delivery_zones(is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_zones_cities ON delivery_zones USING GIN(cities);

-- ==================================================
-- 📋 الجزء 3: إنشاء جدول البكجات
-- ==================================================

-- 4️⃣ جدول delivery_batches
CREATE TABLE IF NOT EXISTS delivery_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_number VARCHAR(50) UNIQUE NOT NULL,
    zone_id UUID REFERENCES delivery_zones(id) ON DELETE SET NULL,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    status batch_status NOT NULL DEFAULT 'collecting',
    scheduled_date DATE NOT NULL,
    estimated_delivery VARCHAR(100),
    total_orders INTEGER DEFAULT 0,
    total_amount DECIMAL(10, 2) DEFAULT 0,
    total_delivery_fee DECIMAL(10, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Indexes للأداء
CREATE INDEX IF NOT EXISTS idx_delivery_batches_zone ON delivery_batches(zone_id);
CREATE INDEX IF NOT EXISTS idx_delivery_batches_driver ON delivery_batches(driver_id);
CREATE INDEX IF NOT EXISTS idx_delivery_batches_status ON delivery_batches(status);
CREATE INDEX IF NOT EXISTS idx_delivery_batches_date ON delivery_batches(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_delivery_batches_number ON delivery_batches(batch_number);

-- ==================================================
-- 📋 الجزء 4: تحديث جدول الطلبات
-- ==================================================

-- 5️⃣ إضافة أعمدة جديدة لجدول orders
DO $$ BEGIN
    -- نوع التوصيل
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_type delivery_type DEFAULT 'instant';
    
    -- معرف البكج
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES delivery_batches(id) ON DELETE SET NULL;
    
    -- معرف المنطقة
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS zone_id UUID REFERENCES delivery_zones(id) ON DELETE SET NULL;
    
    -- هل الطلب جاهز للاستلام
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_ready_for_pickup BOOLEAN DEFAULT false;
    
    -- وقت الاستلام المتوقع
    ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup_time TIMESTAMP WITH TIME ZONE;
    
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Indexes للأعمدة الجديدة
CREATE INDEX IF NOT EXISTS idx_orders_delivery_type ON orders(delivery_type);
CREATE INDEX IF NOT EXISTS idx_orders_batch_id ON orders(batch_id);
CREATE INDEX IF NOT EXISTS idx_orders_zone_id ON orders(zone_id);
CREATE INDEX IF NOT EXISTS idx_orders_ready_pickup ON orders(is_ready_for_pickup) WHERE is_ready_for_pickup = true;

-- ==================================================
-- 📋 الجزء 5: الدوال (Functions)
-- ==================================================

-- 6️⃣ دالة تحديد نوع التوصيل تلقائياً
DROP FUNCTION IF EXISTS determine_delivery_type(UUID);
CREATE OR REPLACE FUNCTION determine_delivery_type(vendor_id_param UUID)
RETURNS delivery_type AS $$
DECLARE
    store_type VARCHAR;
BEGIN
    -- الحصول على نوع المتجر
    SELECT category INTO store_type
    FROM stores
    WHERE id = vendor_id_param;
    
    -- المطاعم والكافيهات = فوري
    IF store_type IN ('restaurant', 'cafe', 'food') THEN
        RETURN 'instant'::delivery_type;
    ELSE
        -- باقي المتاجر = مجدول
        RETURN 'scheduled'::delivery_type;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 7️⃣ دالة إيجاد المنطقة من الإحداثيات
DROP FUNCTION IF EXISTS find_delivery_zone(DECIMAL, DECIMAL);
CREATE OR REPLACE FUNCTION find_delivery_zone(lat DECIMAL, lng DECIMAL)
RETURNS UUID AS $$
DECLARE
    zone_id_result UUID;
BEGIN
    -- هنا يمكن إضافة منطق أكثر تعقيداً للبحث الجغرافي
    -- حالياً نرجع أول منطقة نشطة
    SELECT id INTO zone_id_result
    FROM delivery_zones
    WHERE is_active = true
    ORDER BY delivery_fee ASC
    LIMIT 1;
    
    RETURN zone_id_result;
END;
$$ LANGUAGE plpgsql;

-- 8️⃣ دالة إنشاء رقم بكج
DROP FUNCTION IF EXISTS generate_batch_number();
CREATE OR REPLACE FUNCTION generate_batch_number()
RETURNS VARCHAR AS $$
DECLARE
    batch_num VARCHAR;
    counter INTEGER;
BEGIN
    -- الحصول على عدد البكجات اليوم
    SELECT COUNT(*) INTO counter
    FROM delivery_batches
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- إنشاء رقم البكج: BATCH-YYYYMMDD-XXX
    batch_num := 'BATCH-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((counter + 1)::TEXT, 3, '0');
    
    RETURN batch_num;
END;
$$ LANGUAGE plpgsql;

-- 9️⃣ دالة إنشاء بكج جديد
DROP FUNCTION IF EXISTS create_delivery_batch(UUID, DATE, UUID[]);
CREATE OR REPLACE FUNCTION create_delivery_batch(
    p_zone_id UUID,
    p_scheduled_date DATE,
    p_order_ids UUID[]
)
RETURNS UUID AS $$
DECLARE
    v_batch_id UUID;
    v_batch_number VARCHAR;
    v_total_amount DECIMAL;
    v_total_delivery_fee DECIMAL;
    v_estimated_delivery VARCHAR;
    v_order_id UUID;
BEGIN
    -- إنشاء رقم البكج
    v_batch_number := generate_batch_number();
    
    -- الحصول على التقدير والرسوم من المنطقة
    SELECT 
        estimated_days || ' أيام',
        delivery_fee
    INTO v_estimated_delivery, v_total_delivery_fee
    FROM delivery_zones
    WHERE id = p_zone_id;
    
    -- إنشاء البكج
    INSERT INTO delivery_batches (
        batch_number,
        zone_id,
        scheduled_date,
        estimated_delivery,
        status
    ) VALUES (
        v_batch_number,
        p_zone_id,
        p_scheduled_date,
        v_estimated_delivery,
        'collecting'
    ) RETURNING id INTO v_batch_id;
    
    -- إضافة الطلبات للبكج
    FOREACH v_order_id IN ARRAY p_order_ids
    LOOP
        UPDATE orders
        SET 
            batch_id = v_batch_id,
            zone_id = p_zone_id,
            delivery_type = 'scheduled'
        WHERE id = v_order_id;
    END LOOP;
    
    -- تحديث إحصائيات البكج
    PERFORM update_batch_stats(v_batch_id);
    
    RETURN v_batch_id;
END;
$$ LANGUAGE plpgsql;

-- 🔟 دالة تحديث إحصائيات البكج
DROP FUNCTION IF EXISTS update_batch_stats(UUID);
CREATE OR REPLACE FUNCTION update_batch_stats(p_batch_id UUID)
RETURNS VOID AS $$
DECLARE
    v_total_orders INTEGER;
    v_total_amount DECIMAL;
    v_total_delivery_fee DECIMAL;
BEGIN
    SELECT 
        COUNT(*),
        COALESCE(SUM(total_amount), 0),
        COALESCE(SUM(delivery_fee), 0)
    INTO v_total_orders, v_total_amount, v_total_delivery_fee
    FROM orders
    WHERE batch_id = p_batch_id;
    
    UPDATE delivery_batches
    SET 
        total_orders = v_total_orders,
        total_amount = v_total_amount,
        total_delivery_fee = v_total_delivery_fee,
        updated_at = NOW()
    WHERE id = p_batch_id;
END;
$$ LANGUAGE plpgsql;

-- 1️⃣1️⃣ دالة حساب رسوم التوصيل
DROP FUNCTION IF EXISTS calculate_delivery_fee(UUID, UUID);
CREATE OR REPLACE FUNCTION calculate_delivery_fee(
    p_vendor_id UUID,
    p_zone_id UUID DEFAULT NULL
)
RETURNS DECIMAL AS $$
DECLARE
    v_delivery_type delivery_type;
    v_fee DECIMAL;
BEGIN
    -- تحديد نوع التوصيل
    v_delivery_type := determine_delivery_type(p_vendor_id);
    
    IF v_delivery_type = 'instant' THEN
        -- رسوم ثابتة للفوري (يمكن تعديلها)
        v_fee := 15.00;
    ELSE
        -- رسوم من جدول المناطق للمجدول
        SELECT delivery_fee INTO v_fee
        FROM delivery_zones
        WHERE id = p_zone_id AND is_active = true;
        
        IF v_fee IS NULL THEN
            v_fee := 10.00; -- رسوم افتراضية
        END IF;
    END IF;
    
    RETURN v_fee;
END;
$$ LANGUAGE plpgsql;

-- 1️⃣2️⃣ دالة الحصول على الوقت المتوقع للتوصيل
DROP FUNCTION IF EXISTS get_estimated_delivery(UUID, UUID);
CREATE OR REPLACE FUNCTION get_estimated_delivery(
    p_vendor_id UUID,
    p_zone_id UUID DEFAULT NULL
)
RETURNS VARCHAR AS $$
DECLARE
    v_delivery_type delivery_type;
    v_estimation VARCHAR;
BEGIN
    v_delivery_type := determine_delivery_type(p_vendor_id);
    
    IF v_delivery_type = 'instant' THEN
        v_estimation := '30-45 دقيقة';
    ELSE
        SELECT estimated_days || ' أيام'
        INTO v_estimation
        FROM delivery_zones
        WHERE id = p_zone_id AND is_active = true;
        
        IF v_estimation IS NULL THEN
            v_estimation := '2-3 أيام';
        END IF;
    END IF;
    
    RETURN v_estimation;
END;
$$ LANGUAGE plpgsql;

-- ==================================================
-- 📋 الجزء 6: Triggers
-- ==================================================

-- 1️⃣3️⃣ Trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_delivery_zones_updated_at ON delivery_zones;
CREATE TRIGGER update_delivery_zones_updated_at
    BEFORE UPDATE ON delivery_zones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_delivery_batches_updated_at ON delivery_batches;
CREATE TRIGGER update_delivery_batches_updated_at
    BEFORE UPDATE ON delivery_batches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 1️⃣4️⃣ Trigger لتحديث إحصائيات البكج عند تغيير الطلبات
CREATE OR REPLACE FUNCTION trigger_update_batch_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.batch_id IS NOT NULL THEN
        PERFORM update_batch_stats(NEW.batch_id);
    END IF;
    
    IF OLD.batch_id IS NOT NULL AND OLD.batch_id != NEW.batch_id THEN
        PERFORM update_batch_stats(OLD.batch_id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_batch_stats_on_order_change ON orders;
CREATE TRIGGER update_batch_stats_on_order_change
    AFTER UPDATE OF batch_id, total_amount, delivery_fee ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_batch_stats();

-- ==================================================
-- 📋 الجزء 7: RLS Policies
-- ==================================================

-- 1️⃣5️⃣ تفعيل RLS على الجداول الجديدة
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_batches ENABLE ROW LEVEL SECURITY;

-- 1️⃣6️⃣ Policies لجدول delivery_zones
DROP POLICY IF EXISTS "المناطق متاحة للجميع للقراءة" ON delivery_zones;
CREATE POLICY "المناطق متاحة للجميع للقراءة"
    ON delivery_zones FOR SELECT
    TO authenticated
    USING (is_active = true);

DROP POLICY IF EXISTS "المدراء فقط يمكنهم إدارة المناطق" ON delivery_zones;
CREATE POLICY "المدراء فقط يمكنهم إدارة المناطق"
    ON delivery_zones FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- 1️⃣7️⃣ Policies لجدول delivery_batches
DROP POLICY IF EXISTS "المدراء يمكنهم رؤية جميع البكجات" ON delivery_batches;
CREATE POLICY "المدراء يمكنهم رؤية جميع البكجات"
    ON delivery_batches FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

DROP POLICY IF EXISTS "السائقون يمكنهم رؤية بكجاتهم" ON delivery_batches;
CREATE POLICY "السائقون يمكنهم رؤية بكجاتهم"
    ON delivery_batches FOR SELECT
    TO authenticated
    USING (
        driver_id IN (
            SELECT id FROM drivers WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "المدراء فقط يمكنهم إدارة البكجات" ON delivery_batches;
CREATE POLICY "المدراء فقط يمكنهم إدارة البكجات"
    ON delivery_batches FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- ==================================================
-- 📋 الجزء 8: بيانات أولية (Seed Data)
-- ==================================================

-- 1️⃣8️⃣ إدراج مناطق توصيل افتراضية (معطل - أضف المناطق من Admin Panel)
-- يمكنك إضافة المناطق يدوياً من لوحة التحكم: /dashboard/admin/delivery-zones
-- أو استخدم هذا المثال لإضافة مناطقك:
/*
INSERT INTO delivery_zones (name, name_ar, governorate, cities, center_lat, center_lng, radius_km, delivery_fee, estimated_days)
VALUES
    ('Your City', 'مدينتك', 'Your Governorate', ARRAY['Area1', 'Area2'], 0.0, 0.0, 10, 15.00, 2)
ON CONFLICT DO NOTHING;
*/

-- ==================================================
-- ✅ انتهى Migration!
-- ==================================================

-- رسالة نجاح
DO $$ BEGIN
    RAISE NOTICE '✅ تم إنشاء نظام التوصيل المزدوج بنجاح!';
    RAISE NOTICE '📦 الجداول: delivery_zones, delivery_batches';
    RAISE NOTICE '⚙️ الدوال: 9 دوال';
    RAISE NOTICE '🔒 RLS Policies: مفعّلة';
    RAISE NOTICE '🎯 النظام جاهز للاستخدام!';
END $$;
