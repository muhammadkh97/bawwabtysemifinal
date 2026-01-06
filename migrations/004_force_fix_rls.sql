-- =====================================================
-- 🔒 إصلاح RLS Policies بالقوة (Force Fix)
-- =====================================================
-- التاريخ: 2026-01-07
-- =====================================================

-- ==================================================
-- 🗑️ حذف جميع الـ Policies القديمة
-- ==================================================

-- حذف policies لـ delivery_zones
DROP POLICY IF EXISTS "المناطق متاحة للجميع للقراءة" ON delivery_zones;
DROP POLICY IF EXISTS "المدراء فقط يمكنهم إدارة المناطق" ON delivery_zones;
DROP POLICY IF EXISTS "enable_read_delivery_zones_for_all" ON delivery_zones;
DROP POLICY IF EXISTS "enable_all_delivery_zones_for_admins" ON delivery_zones;

-- حذف policies لـ delivery_batches
DROP POLICY IF EXISTS "المدراء يمكنهم رؤية جميع البكجات" ON delivery_batches;
DROP POLICY IF EXISTS "السائقون يمكنهم رؤية بكجاتهم" ON delivery_batches;
DROP POLICY IF EXISTS "المدراء فقط يمكنهم إدارة البكجات" ON delivery_batches;
DROP POLICY IF EXISTS "enable_read_delivery_batches_for_admins" ON delivery_batches;
DROP POLICY IF EXISTS "enable_read_delivery_batches_for_drivers" ON delivery_batches;
DROP POLICY IF EXISTS "enable_all_delivery_batches_for_admins" ON delivery_batches;

-- ==================================================
-- 📊 تعطيل ثم تفعيل RLS
-- ==================================================

-- تعطيل مؤقت لإعادة التهيئة
ALTER TABLE delivery_zones DISABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_batches DISABLE ROW LEVEL SECURITY;

-- إعادة تفعيل
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_batches ENABLE ROW LEVEL SECURITY;

-- ==================================================
-- ✅ إنشاء Policies جديدة - delivery_zones
-- ==================================================

-- 1️⃣ قراءة للجميع (authenticated users)
CREATE POLICY "zones_select_authenticated"
    ON delivery_zones FOR SELECT
    TO authenticated
    USING (true);

-- 2️⃣ إدارة كاملة للمدراء
CREATE POLICY "zones_all_for_admins"
    ON delivery_zones FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- ==================================================
-- ✅ إنشاء Policies جديدة - delivery_batches
-- ==================================================

-- 1️⃣ قراءة للمدراء
CREATE POLICY "batches_select_admins"
    ON delivery_batches FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- 2️⃣ قراءة للسائقين (بكجاتهم فقط)
CREATE POLICY "batches_select_drivers"
    ON delivery_batches FOR SELECT
    TO authenticated
    USING (
        driver_id IN (
            SELECT id FROM drivers WHERE user_id = auth.uid()
        )
    );

-- 3️⃣ إدارة كاملة للمدراء (INSERT, UPDATE, DELETE)
CREATE POLICY "batches_all_for_admins"
    ON delivery_batches FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- ==================================================
-- 🔍 التحقق من الـ Policies
-- ==================================================

DO $$ 
DECLARE
    zones_policies INTEGER;
    batches_policies INTEGER;
BEGIN
    -- عد policies لـ delivery_zones
    SELECT COUNT(*) INTO zones_policies
    FROM pg_policies
    WHERE tablename = 'delivery_zones';
    
    -- عد policies لـ delivery_batches
    SELECT COUNT(*) INTO batches_policies
    FROM pg_policies
    WHERE tablename = 'delivery_batches';
    
    RAISE NOTICE '✅ تم إصلاح RLS Policies بنجاح!';
    RAISE NOTICE '📊 delivery_zones: % policies', zones_policies;
    RAISE NOTICE '📊 delivery_batches: % policies', batches_policies;
    RAISE NOTICE '🔒 المناطق: قراءة للجميع، إدارة للمدراء';
    RAISE NOTICE '🔒 البكجات: قراءة للمدراء والسائقين، إدارة للمدراء فقط';
    RAISE NOTICE '🎯 النظام جاهز!';
END $$;
