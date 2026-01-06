-- =====================================================
-- 🔍 فحص نظام التوصيل الشامل
-- Comprehensive Delivery System Inspection
-- =====================================================
-- التاريخ: 2026-01-06
-- الغرض: فحص شامل لنظام التوصيل الحالي
-- =====================================================

-- ==================================================
-- 📋 الجزء 1: فحص جداول التوصيل
-- ==================================================

-- 1️⃣ فحص جدول deliveries
SELECT 
    '🚚 جدول DELIVERIES' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'deliveries'
ORDER BY ordinal_position;

-- 2️⃣ فحص جدول orders (الأعمدة المتعلقة بالتوصيل)
SELECT 
    '📦 جدول ORDERS - أعمدة التوصيل' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'orders'
  AND (
    column_name LIKE '%delivery%'
    OR column_name LIKE '%driver%'
    OR column_name LIKE '%shipping%'
    OR column_name IN ('status', 'order_type')
  )
ORDER BY ordinal_position;

-- 3️⃣ فحص جدول delivery_areas
SELECT 
    '🗺️ جدول DELIVERY_AREAS' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'delivery_areas'
ORDER BY ordinal_position;

-- 4️⃣ فحص جداول أخرى متعلقة بالتوصيل
SELECT 
    '📊 جداول متعلقة بالتوصيل' as section,
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%delivery%'
    OR table_name LIKE '%driver%'
    OR table_name LIKE '%shipping%'
  )
ORDER BY table_name;

-- ==================================================
-- 📋 الجزء 2: فحص Constraints والعلاقات
-- ==================================================

-- 5️⃣ فحص Foreign Keys في deliveries
SELECT 
    '🔗 علاقات جدول DELIVERIES' as section,
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'deliveries'::regclass
ORDER BY contype, conname;

-- 6️⃣ فحص Indexes في deliveries
SELECT 
    '📇 فهارس جدول DELIVERIES' as section,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'deliveries'
ORDER BY indexname;

-- ==================================================
-- 📋 الجزء 3: فحص الـ Functions والـ Triggers
-- ==================================================

-- 7️⃣ فحص الدوال المتعلقة بالتوصيل
SELECT 
    '⚙️ دوال التوصيل' as section,
    proname as function_name,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND (
    proname LIKE '%delivery%'
    OR proname LIKE '%driver%'
    OR proname LIKE '%assign%'
  )
ORDER BY proname;

-- 8️⃣ فحص الـ Triggers على deliveries
SELECT 
    '🔔 مشغلات جدول DELIVERIES' as section,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table = 'deliveries'
ORDER BY trigger_name;

-- ==================================================
-- 📋 الجزء 4: فحص RLS Policies
-- ==================================================

-- 9️⃣ فحص سياسات deliveries
SELECT 
    '🔒 سياسات RLS - DELIVERIES' as section,
    policyname,
    cmd as operation,
    qual as using_clause,
    with_check as check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'deliveries'
ORDER BY cmd, policyname;

-- 🔟 فحص سياسات orders (المتعلقة بالتوصيل)
SELECT 
    '🔒 سياسات RLS - ORDERS' as section,
    policyname,
    cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'orders'
  AND (
    policyname LIKE '%delivery%'
    OR policyname LIKE '%driver%'
  )
ORDER BY cmd, policyname;

-- ==================================================
-- 📋 الجزء 5: فحص البيانات الحالية
-- ==================================================

-- 1️⃣1️⃣ إحصائيات deliveries
SELECT 
    '📊 إحصائيات DELIVERIES' as section,
    COUNT(*) as total_deliveries,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'assigned' THEN 1 END) as assigned,
    COUNT(CASE WHEN status = 'picked_up' THEN 1 END) as picked_up,
    COUNT(CASE WHEN status = 'in_transit' THEN 1 END) as in_transit,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
    COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
    COUNT(DISTINCT driver_id) as unique_drivers,
    COUNT(DISTINCT order_id) as unique_orders
FROM deliveries;

-- 1️⃣2️⃣ إحصائيات orders حسب نوع التوصيل
SELECT 
    '📦 إحصائيات ORDERS - نوع التوصيل' as section,
    order_type,
    COUNT(*) as total_orders,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed,
    COUNT(CASE WHEN status = 'preparing' THEN 1 END) as preparing,
    COUNT(CASE WHEN status = 'ready' THEN 1 END) as ready,
    COUNT(CASE WHEN status = 'out_for_delivery' THEN 1 END) as out_for_delivery,
    COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered,
    AVG(delivery_fee) as avg_delivery_fee
FROM orders
GROUP BY order_type;

-- 1️⃣3️⃣ فحص delivery_areas
SELECT 
    '🗺️ إحصائيات DELIVERY_AREAS' as section,
    COUNT(*) as total_areas,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_areas,
    AVG(delivery_fee) as avg_delivery_fee,
    MIN(delivery_fee) as min_delivery_fee,
    MAX(delivery_fee) as max_delivery_fee
FROM delivery_areas;

-- 1️⃣4️⃣ عينة من deliveries
SELECT 
    '📋 عينة DELIVERIES (آخر 5)' as section,
    id,
    order_id,
    driver_id,
    status,
    delivery_type,
    estimated_delivery_time,
    actual_delivery_time,
    created_at
FROM deliveries
ORDER BY created_at DESC
LIMIT 5;

-- 1️⃣5️⃣ عينة من orders
SELECT 
    '📋 عينة ORDERS (آخر 5)' as section,
    id,
    order_type,
    status,
    delivery_fee,
    delivery_address,
    driver_id,
    created_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;

-- ==================================================
-- 📋 الجزء 6: فحص ENUMS
-- ==================================================

-- 1️⃣6️⃣ فحص Enum Types المتعلقة بالتوصيل
SELECT 
    '🏷️ ENUM Types - التوصيل' as section,
    t.typname as enum_name,
    e.enumlabel as enum_value,
    e.enumsortorder as sort_order
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN (
    'delivery_status',
    'delivery_type',
    'order_type',
    'order_status'
)
ORDER BY t.typname, e.enumsortorder;

-- ==================================================
-- ✅ انتهى الفحص!
-- ==================================================

SELECT '✅ اكتمل فحص نظام التوصيل بنجاح!' as result;
