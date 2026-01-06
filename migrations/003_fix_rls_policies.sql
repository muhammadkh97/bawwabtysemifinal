-- =====================================================
-- 🔒 إصلاح RLS Policies لنظام التوصيل
-- Fix RLS Policies for Delivery System
-- =====================================================
-- التاريخ: 2026-01-07
-- =====================================================

-- ==================================================
-- 🔧 إصلاح Policies لجدول delivery_zones
-- ==================================================

-- حذف الـ Policies القديمة
DROP POLICY IF EXISTS "المناطق متاحة للجميع للقراءة" ON delivery_zones;
DROP POLICY IF EXISTS "المدراء فقط يمكنهم إدارة المناطق" ON delivery_zones;

-- إنشاء Policy جديدة للقراءة (للجميع)
CREATE POLICY "enable_read_delivery_zones_for_all"
    ON delivery_zones FOR SELECT
    TO authenticated
    USING (true);

-- إنشاء Policy للإدارة (للمدراء فقط)
CREATE POLICY "enable_all_delivery_zones_for_admins"
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
-- 🔧 إصلاح Policies لجدول delivery_batches
-- ==================================================

-- حذف الـ Policies القديمة
DROP POLICY IF EXISTS "المدراء يمكنهم رؤية جميع البكجات" ON delivery_batches;
DROP POLICY IF EXISTS "السائقون يمكنهم رؤية بكجاتهم" ON delivery_batches;
DROP POLICY IF EXISTS "المدراء فقط يمكنهم إدارة البكجات" ON delivery_batches;

-- Policy للمدراء (قراءة كل شي)
CREATE POLICY "enable_read_delivery_batches_for_admins"
    ON delivery_batches FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Policy للسائقين (قراءة بكجاتهم فقط)
CREATE POLICY "enable_read_delivery_batches_for_drivers"
    ON delivery_batches FOR SELECT
    TO authenticated
    USING (
        driver_id IN (
            SELECT id FROM drivers WHERE user_id = auth.uid()
        )
    );

-- Policy للمدراء (إدارة كاملة)
CREATE POLICY "enable_all_delivery_batches_for_admins"
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
-- ✅ تم إصلاح RLS Policies!
-- ==================================================

DO $$ BEGIN
    RAISE NOTICE '✅ تم إصلاح RLS Policies بنجاح!';
    RAISE NOTICE '🔒 delivery_zones: متاحة للقراءة للجميع';
    RAISE NOTICE '🔒 delivery_batches: قراءة للمدراء والسائقين، تعديل للمدراء فقط';
    RAISE NOTICE '🎯 النظام جاهز الآن!';
END $$;
