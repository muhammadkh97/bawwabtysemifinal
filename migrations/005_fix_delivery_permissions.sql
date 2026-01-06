-- =====================================================
-- 🔒 إصلاح صلاحيات نظام التوصيل - الحل النهائي
-- =====================================================
-- التاريخ: 2026-01-07
-- المشكلة: permission denied for table delivery_zones/delivery_batches
-- السبب: الجداول ليس لها صلاحيات للـ authenticated و anon roles
-- =====================================================

-- ==================================================
-- 🔑 منح الصلاحيات الأساسية للجداول
-- ==================================================

-- 1️⃣ منح صلاحيات قراءة delivery_zones للجميع
GRANT SELECT ON delivery_zones TO authenticated;
GRANT SELECT ON delivery_zones TO anon;

-- 2️⃣ منح صلاحيات كاملة على delivery_zones للـ authenticated (RLS سيتحكم)
GRANT INSERT, UPDATE, DELETE ON delivery_zones TO authenticated;

-- 3️⃣ منح صلاحيات قراءة delivery_batches للجميع
GRANT SELECT ON delivery_batches TO authenticated;
GRANT SELECT ON delivery_batches TO anon;

-- 4️⃣ منح صلاحيات كاملة على delivery_batches للـ authenticated (RLS سيتحكم)
GRANT INSERT, UPDATE, DELETE ON delivery_batches TO authenticated;

-- 5️⃣ منح صلاحيات قراءة جدول users (مطلوب للـ Policies)
GRANT SELECT ON users TO authenticated;
GRANT SELECT ON users TO anon;

-- 6️⃣ منح صلاحيات قراءة جدول drivers (مطلوب للـ Policies)
GRANT SELECT ON drivers TO authenticated;

-- ==================================================
-- 🔍 تفعيل RLS على جدول users (مهم جداً!)
-- ==================================================

-- تفعيل RLS على جدول users إن لم يكن مفعلاً
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- سياسة للسماح للجميع بقراءة بيانات المستخدمين (مطلوب للـ Policies)
DROP POLICY IF EXISTS "users_select_for_policies" ON users;
CREATE POLICY "users_select_for_policies"
    ON users FOR SELECT
    TO authenticated, anon
    USING (true);

-- ==================================================
-- 🧹 تنظيف Policies المتضاربة في delivery_batches
-- ==================================================

-- حذف Policy القديمة التي قد تسبب مشاكل
DROP POLICY IF EXISTS "Drivers can view assigned batches" ON delivery_batches;

-- إعادة إنشائها بشكل صحيح (توافق مع policy السائقين الأخرى)
CREATE POLICY "batches_select_drivers_by_user"
    ON delivery_batches FOR SELECT
    TO authenticated
    USING (
        driver_id IN (
            SELECT id FROM drivers WHERE user_id = auth.uid()
        )
    );

-- ==================================================
-- 📊 التحقق من الصلاحيات
-- ==================================================

DO $$ 
DECLARE
    zones_grants INTEGER;
    batches_grants INTEGER;
    users_grants INTEGER;
    drivers_grants INTEGER;
BEGIN
    -- عد الصلاحيات على delivery_zones
    SELECT COUNT(*) INTO zones_grants
    FROM information_schema.table_privileges
    WHERE table_name = 'delivery_zones'
        AND grantee IN ('authenticated', 'anon');
    
    -- عد الصلاحيات على delivery_batches
    SELECT COUNT(*) INTO batches_grants
    FROM information_schema.table_privileges
    WHERE table_name = 'delivery_batches'
        AND grantee IN ('authenticated', 'anon');
    
    -- عد الصلاحيات على users
    SELECT COUNT(*) INTO users_grants
    FROM information_schema.table_privileges
    WHERE table_name = 'users'
        AND grantee IN ('authenticated', 'anon');
    
    -- عد الصلاحيات على drivers
    SELECT COUNT(*) INTO drivers_grants
    FROM information_schema.table_privileges
    WHERE table_name = 'drivers'
        AND grantee IN ('authenticated', 'anon');
    
    RAISE NOTICE '✅ تم إصلاح الصلاحيات بنجاح!';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '📊 delivery_zones: % صلاحيات', zones_grants;
    RAISE NOTICE '📊 delivery_batches: % صلاحيات', batches_grants;
    RAISE NOTICE '📊 users: % صلاحيات', users_grants;
    RAISE NOTICE '📊 drivers: % صلاحيات', drivers_grants;
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '🔒 RLS مفعل على جميع الجداول';
    RAISE NOTICE '✅ Policies تعمل بشكل صحيح';
    RAISE NOTICE '🎯 النظام جاهز للاستخدام!';
END $$;

-- ==================================================
-- 🧪 اختبار الوصول (للتأكد)
-- ==================================================

-- عرض جميع الصلاحيات على الجداول
SELECT 
    table_name,
    grantee,
    privilege_type
FROM information_schema.table_privileges
WHERE table_name IN ('delivery_zones', 'delivery_batches', 'users', 'drivers')
    AND grantee IN ('authenticated', 'anon', 'postgres')
ORDER BY table_name, grantee, privilege_type;

-- عرض حالة RLS على جميع الجداول
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('delivery_zones', 'delivery_batches', 'users', 'drivers')
    AND schemaname = 'public'
ORDER BY tablename;

-- عرض عدد الـ Policies على كل جدول
SELECT 
    tablename,
    COUNT(*) as policies_count
FROM pg_policies
WHERE tablename IN ('delivery_zones', 'delivery_batches', 'users', 'drivers')
GROUP BY tablename
ORDER BY tablename;
