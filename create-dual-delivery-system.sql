-- ===================================================================
-- نظام التوصيل المزدوج: توصيل فوري للمطاعم + توصيل مجدول للمنتجات
-- ===================================================================

-- ========================================
-- 1. إضافة أنواع التوصيل (Enums)
-- ========================================

-- نوع التوصيل
DO $$ BEGIN
    CREATE TYPE delivery_type AS ENUM ('instant', 'scheduled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- حالة الدفعة
DO $$ BEGIN
    CREATE TYPE batch_status AS ENUM (
        'collecting',      -- جمع الطلبات
        'ready',          -- جاهزة للتوصيل
        'assigned',       -- تم تعيين سائق
        'in_transit',     -- قيد التوصيل
        'completed',      -- مكتملة
        'cancelled'       -- ملغاة
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

COMMENT ON TYPE delivery_type IS 'instant: توصيل فوري للمطاعم | scheduled: توصيل مجدول للمنتجات';
COMMENT ON TYPE batch_status IS 'حالة دفعة التوصيل المجمعة';

-- ========================================
-- 2. إضافة أعمدة جديدة لجدول orders
-- ========================================

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_type delivery_type DEFAULT 'scheduled',
ADD COLUMN IF NOT EXISTS batch_id UUID,
ADD COLUMN IF NOT EXISTS zone_id UUID,
ADD COLUMN IF NOT EXISTS pickup_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_ready_for_pickup BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS picked_up_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivery_started_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.orders.delivery_type IS 'نوع التوصيل: instant للمطاعم، scheduled للمنتجات';
COMMENT ON COLUMN public.orders.batch_id IS 'معرف الدفعة (للتوصيل المجدول فقط)';
COMMENT ON COLUMN public.orders.zone_id IS 'معرف المنطقة';
COMMENT ON COLUMN public.orders.is_ready_for_pickup IS 'هل الطلب جاهز للاستلام من المتجر';
COMMENT ON COLUMN public.orders.pickup_time IS 'وقت استلام الطلب من المتجر';

-- ========================================
-- 3. جدول مناطق التوصيل (Delivery Zones)
-- ========================================

CREATE TABLE IF NOT EXISTS public.delivery_zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    governorate TEXT NOT NULL,
    cities TEXT[] NOT NULL,
    boundaries JSONB,
    center_lat DOUBLE PRECISION,
    center_lng DOUBLE PRECISION,
    radius_km NUMERIC DEFAULT 5,
    delivery_fee NUMERIC DEFAULT 5,
    estimated_days INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.delivery_zones IS 'مناطق التوصيل لتجميع الطلبات';
COMMENT ON COLUMN public.delivery_zones.cities IS 'قائمة المدن/الأحياء في المنطقة';
COMMENT ON COLUMN public.delivery_zones.boundaries IS 'حدود المنطقة (GeoJSON Polygon)';
COMMENT ON COLUMN public.delivery_zones.estimated_days IS 'عدد أيام التوصيل المتوقعة';

-- ========================================
-- 4. جدول دفعات التوصيل (Delivery Batches)
-- ========================================

CREATE TABLE IF NOT EXISTS public.delivery_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_number TEXT UNIQUE NOT NULL,
    zone_id UUID REFERENCES delivery_zones(id),
    driver_id UUID REFERENCES users(id),
    status batch_status DEFAULT 'collecting',
    total_orders INTEGER DEFAULT 0,
    total_amount NUMERIC DEFAULT 0,
    delivery_fee NUMERIC DEFAULT 0,
    scheduled_date DATE NOT NULL,
    collection_deadline TIMESTAMP WITH TIME ZONE,
    assigned_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.delivery_batches IS 'دفعات التوصيل المجمعة للمنتجات العادية';
COMMENT ON COLUMN public.delivery_batches.collection_deadline IS 'آخر موعد لتجميع الطلبات من المتاجر';
COMMENT ON COLUMN public.delivery_batches.scheduled_date IS 'تاريخ التوصيل المخطط';

-- ========================================
-- 5. جدول طلبات الاستلام من المتاجر
-- ========================================

CREATE TABLE IF NOT EXISTS public.store_pickups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES stores(id),
    batch_id UUID REFERENCES delivery_batches(id),
    status TEXT DEFAULT 'pending',
    scheduled_time TIMESTAMP WITH TIME ZONE,
    picked_up_at TIMESTAMP WITH TIME ZONE,
    picker_notes TEXT,
    vendor_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE public.store_pickups IS 'جدول لتنظيم استلام الطلبات من المتاجر';
COMMENT ON COLUMN public.store_pickups.status IS 'pending, ready, collected, failed';

-- ========================================
-- 6. جدول تتبع التوصيل (Delivery Tracking)
-- ========================================

CREATE TABLE IF NOT EXISTS public.delivery_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES delivery_batches(id),
    driver_id UUID REFERENCES users(id),
    status TEXT NOT NULL,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    notes TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_tracking_order ON delivery_tracking(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_batch ON delivery_tracking(batch_id);

COMMENT ON TABLE public.delivery_tracking IS 'سجل تتبع حالة التوصيل والموقع';

-- ========================================
-- 7. إنشاء Indexes للأداء
-- ========================================

CREATE INDEX IF NOT EXISTS idx_orders_delivery_type ON orders(delivery_type);
CREATE INDEX IF NOT EXISTS idx_orders_batch_id ON orders(batch_id);
CREATE INDEX IF NOT EXISTS idx_orders_zone_id ON orders(zone_id);
CREATE INDEX IF NOT EXISTS idx_orders_ready_pickup ON orders(is_ready_for_pickup) WHERE is_ready_for_pickup = true;
CREATE INDEX IF NOT EXISTS idx_batches_status ON delivery_batches(status);
CREATE INDEX IF NOT EXISTS idx_batches_zone ON delivery_batches(zone_id);
CREATE INDEX IF NOT EXISTS idx_batches_date ON delivery_batches(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_store_pickups_status ON store_pickups(status);

-- ========================================
-- 8. إدراج مناطق التوصيل الأساسية (الأردن)
-- ========================================

INSERT INTO public.delivery_zones (name, name_ar, governorate, cities, center_lat, center_lng, radius_km, delivery_fee, estimated_days) VALUES
-- عمان
('Amman Central', 'عمان الوسط', 'Amman', ARRAY['Downtown', 'Jabal Amman', 'Abdali', 'Shmeisani', 'وسط البلد', 'جبل عمان', 'العبدلي', 'الشميساني'], 31.9539, 35.9106, 5, 3, 1),
('Amman West', 'عمان الغربية', 'Amman', ARRAY['Sweifieh', 'Abdoun', 'Um Uthaina', 'الصويفية', 'عبدون', 'أم أذينة'], 31.9500, 35.8700, 7, 4, 2),
('Amman East', 'عمان الشرقية', 'Amman', ARRAY['Zarqa Road', 'Marka', 'Tla Al Ali', 'طريق الزرقاء', 'ماركا', 'تلاع العلي'], 31.9700, 36.0000, 8, 4, 2),
('Amman North', 'عمان الشمالية', 'Amman', ARRAY['Jubaiha', 'Khalda', 'Arjan', 'الجبيهة', 'خلدا', 'الأرجان'], 31.9900, 35.8800, 7, 4, 2),

-- الزرقاء
('Zarqa', 'الزرقاء', 'Zarqa', ARRAY['Zarqa City', 'Russeifa', 'الزرقاء', 'الرصيفة'], 32.0667, 36.1000, 10, 5, 2),

-- إربد
('Irbid', 'إربد', 'Irbid', ARRAY['Irbid City', 'Ramtha', 'إربد', 'الرمثا'], 32.5500, 35.8500, 12, 6, 3),

-- العقبة
('Aqaba', 'العقبة', 'Aqaba', ARRAY['Aqaba City', 'العقبة'], 29.5267, 35.0067, 8, 10, 3),

-- الكرك
('Karak', 'الكرك', 'Karak', ARRAY['Karak City', 'الكرك'], 31.1853, 35.7044, 10, 7, 3),

-- معان
('Maan', 'معان', 'Maan', ARRAY['Maan City', 'معان'], 30.1920, 35.7360, 10, 8, 3),

-- المفرق
('Mafraq', 'المفرق', 'Mafraq', ARRAY['Mafraq City', 'المفرق'], 32.3400, 36.2080, 10, 7, 3),

-- جرش
('Jerash', 'جرش', 'Jerash', ARRAY['Jerash City', 'جرش'], 32.2811, 35.8994, 8, 6, 2),

-- عجلون
('Ajloun', 'عجلون', 'Ajloun', ARRAY['Ajloun City', 'عجلون'], 32.3325, 35.7517, 8, 6, 2),

-- مادبا
('Madaba', 'مادبا', 'Madaba', ARRAY['Madaba City', 'مادبا'], 31.7167, 35.7933, 8, 5, 2),

-- السلط
('Salt', 'السلط', 'Balqa', ARRAY['Salt City', 'السلط'], 32.0392, 35.7272, 8, 5, 2)

ON CONFLICT DO NOTHING;

-- ========================================
-- 9. دالة لتحديد نوع التوصيل تلقائياً
-- ========================================

CREATE OR REPLACE FUNCTION determine_delivery_type(p_vendor_id UUID)
RETURNS delivery_type AS $$
DECLARE
    v_business_type TEXT;
BEGIN
    -- الحصول على نوع العمل من جدول stores
    SELECT business_type::TEXT INTO v_business_type
    FROM stores
    WHERE id = p_vendor_id;
    
    -- إذا كان مطعم -> توصيل فوري
    IF v_business_type = 'restaurant' THEN
        RETURN 'instant'::delivery_type;
    ELSE
        -- باقي الأنواع -> توصيل مجدول
        RETURN 'scheduled'::delivery_type;
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION determine_delivery_type IS 'تحديد نوع التوصيل بناءً على نوع المتجر';

-- ========================================
-- 10. دالة لتحديد المنطقة من العنوان
-- ========================================

CREATE OR REPLACE FUNCTION find_delivery_zone(
    p_lat DOUBLE PRECISION,
    p_lng DOUBLE PRECISION,
    p_city TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_zone_id UUID;
BEGIN
    -- محاولة إيجاد المنطقة بناءً على المدينة
    IF p_city IS NOT NULL THEN
        SELECT id INTO v_zone_id
        FROM delivery_zones
        WHERE p_city = ANY(cities)
            AND is_active = true
        LIMIT 1;
        
        IF v_zone_id IS NOT NULL THEN
            RETURN v_zone_id;
        END IF;
    END IF;
    
    -- محاولة إيجاد المنطقة بناءً على المسافة
    IF p_lat IS NOT NULL AND p_lng IS NOT NULL THEN
        SELECT id INTO v_zone_id
        FROM delivery_zones
        WHERE is_active = true
        ORDER BY (
            POW(center_lat - p_lat, 2) + 
            POW(center_lng - p_lng, 2)
        ) ASC
        LIMIT 1;
        
        RETURN v_zone_id;
    END IF;
    
    -- إرجاع المنطقة الافتراضية (عمان الوسط)
    SELECT id INTO v_zone_id
    FROM delivery_zones
    WHERE name = 'Amman Central'
    LIMIT 1;
    
    RETURN v_zone_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION find_delivery_zone IS 'تحديد منطقة التوصيل من الإحداثيات أو اسم المدينة';

-- ========================================
-- 11. دالة لإنشاء دفعة توصيل جديدة
-- ========================================

CREATE OR REPLACE FUNCTION create_delivery_batch(
    p_zone_id UUID,
    p_scheduled_date DATE
)
RETURNS UUID AS $$
DECLARE
    v_batch_id UUID;
    v_batch_number TEXT;
BEGIN
    -- توليد رقم الدفعة
    v_batch_number := 'BATCH-' || TO_CHAR(p_scheduled_date, 'YYYYMMDD') || '-' || 
                      LPAD((SELECT COUNT(*) + 1 FROM delivery_batches WHERE scheduled_date = p_scheduled_date)::TEXT, 4, '0');
    
    -- إنشاء الدفعة
    INSERT INTO delivery_batches (
        batch_number,
        zone_id,
        scheduled_date,
        collection_deadline,
        status
    ) VALUES (
        v_batch_number,
        p_zone_id,
        p_scheduled_date,
        p_scheduled_date::TIMESTAMP - INTERVAL '1 day',
        'collecting'
    )
    RETURNING id INTO v_batch_id;
    
    RETURN v_batch_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_delivery_batch IS 'إنشاء دفعة توصيل جديدة لمنطقة معينة';

-- ========================================
-- 12. Trigger لتحديث معلومات الدفعة
-- ========================================

CREATE OR REPLACE FUNCTION update_batch_totals()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.batch_id IS NOT NULL THEN
            UPDATE delivery_batches
            SET 
                total_orders = (SELECT COUNT(*) FROM orders WHERE batch_id = NEW.batch_id),
                total_amount = (SELECT COALESCE(SUM(total), 0) FROM orders WHERE batch_id = NEW.batch_id),
                updated_at = NOW()
            WHERE id = NEW.batch_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.batch_id IS NOT NULL THEN
            UPDATE delivery_batches
            SET 
                total_orders = (SELECT COUNT(*) FROM orders WHERE batch_id = OLD.batch_id),
                total_amount = (SELECT COALESCE(SUM(total), 0) FROM orders WHERE batch_id = OLD.batch_id),
                updated_at = NOW()
            WHERE id = OLD.batch_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_batch_totals ON orders;
CREATE TRIGGER trigger_update_batch_totals
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_batch_totals();

-- ========================================
-- 13. تحديث الطلبات الموجودة
-- ========================================

-- تحديد نوع التوصيل للطلبات الحالية
UPDATE orders o
SET delivery_type = determine_delivery_type(o.vendor_id)
WHERE delivery_type IS NULL;

-- ========================================
-- 14. سياسات الأمان (RLS)
-- ========================================

-- delivery_zones
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active zones" ON public.delivery_zones;
CREATE POLICY "Anyone can view active zones"
ON public.delivery_zones FOR SELECT
TO public
USING (is_active = true);

-- delivery_batches
ALTER TABLE public.delivery_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Drivers can view assigned batches" ON public.delivery_batches;
CREATE POLICY "Drivers can view assigned batches"
ON public.delivery_batches FOR SELECT
TO authenticated
USING (driver_id = auth.uid() OR driver_id IS NULL);

-- store_pickups
ALTER TABLE public.store_pickups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can view their pickups" ON public.store_pickups;
CREATE POLICY "Vendors can view their pickups"
ON public.store_pickups FOR SELECT
TO authenticated
USING (
    vendor_id IN (
        SELECT id FROM stores WHERE user_id = auth.uid()
    )
);

-- delivery_tracking
ALTER TABLE public.delivery_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their order tracking" ON public.delivery_tracking;
CREATE POLICY "Users can view their order tracking"
ON public.delivery_tracking FOR SELECT
TO authenticated
USING (
    order_id IN (
        SELECT id FROM orders WHERE customer_id = auth.uid()
    )
    OR driver_id = auth.uid()
);

-- ========================================
-- 15. Views مفيدة
-- ========================================

-- عرض الطلبات الجاهزة للاستلام
CREATE OR REPLACE VIEW orders_ready_for_pickup AS
SELECT 
    o.*,
    s.name as store_name,
    s.address as store_address,
    s.lat as store_lat,
    s.lng as store_lng,
    dz.name as zone_name
FROM orders o
JOIN stores s ON o.vendor_id = s.id
LEFT JOIN delivery_zones dz ON o.zone_id = dz.id
WHERE o.delivery_type = 'scheduled'
    AND o.is_ready_for_pickup = true
    AND o.picked_up_at IS NULL;

COMMENT ON VIEW orders_ready_for_pickup IS 'الطلبات الجاهزة للاستلام من المتاجر';

-- عرض الدفعات النشطة
CREATE OR REPLACE VIEW active_batches AS
SELECT 
    db.*,
    dz.name as zone_name,
    dz.name_ar as zone_name_ar,
    COUNT(o.id) as actual_orders,
    u.full_name as driver_name,
    u.phone as driver_phone
FROM delivery_batches db
LEFT JOIN delivery_zones dz ON db.zone_id = dz.id
LEFT JOIN orders o ON o.batch_id = db.id
LEFT JOIN users u ON db.driver_id = u.id
WHERE db.status IN ('collecting', 'ready', 'assigned', 'in_transit')
GROUP BY db.id, dz.name, dz.name_ar, u.full_name, u.phone;

COMMENT ON VIEW active_batches IS 'الدفعات النشطة مع تفاصيلها';

-- ========================================
-- ✅ اكتمل بناء نظام التوصيل المزدوج
-- ========================================

SELECT '✅ تم إنشاء نظام التوصيل المزدوج بنجاح!' as status;

SELECT 
    '📊 ملخص النظام:' as info,
    (SELECT COUNT(*) FROM delivery_zones WHERE is_active = true) as "عدد المناطق",
    (SELECT COUNT(*) FROM orders WHERE delivery_type = 'instant') as "طلبات فورية",
    (SELECT COUNT(*) FROM orders WHERE delivery_type = 'scheduled') as "طلبات مجدولة";
