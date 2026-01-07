-- ===================================================================
-- سكريبت تحليل نظام التوصيل الحالي
-- ===================================================================

-- ========================================
-- 1. معلومات جدول الطلبات (orders)
-- ========================================

SELECT 
    '📦 بنية جدول الطلبات (orders):' as info;

SELECT 
    column_name as "اسم العمود",
    data_type as "نوع البيانات",
    is_nullable as "يقبل NULL",
    column_default as "القيمة الافتراضية"
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'orders'
ORDER BY ordinal_position;

-- عينة من الطلبات
SELECT 
    '📋 عينة من الطلبات الحالية:' as info;

SELECT 
    id,
    user_id,
    vendor_id,
    status,
    total,
    delivery_address,
    delivery_status,
    created_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;

-- ========================================
-- 2. معلومات جدول المنتجات (products)
-- ========================================

SELECT 
    '🛍️ بنية جدول المنتجات (products):' as info;

SELECT 
    column_name as "اسم العمود",
    data_type as "نوع البيانات",
    is_nullable as "يقبل NULL"
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'products'
ORDER BY ordinal_position;

-- تحليل أنواع المنتجات
SELECT 
    '📊 تحليل أنواع المنتجات:' as info;

SELECT 
    category,
    COUNT(*) as "عدد المنتجات",
    COUNT(DISTINCT vendor_id) as "عدد البائعين"
FROM products
WHERE is_active = true
GROUP BY category
ORDER BY COUNT(*) DESC;

-- ========================================
-- 3. معلومات المتاجر/البائعين (stores/vendors)
-- ========================================

SELECT 
    '🏪 بنية جدول المتاجر (stores):' as info;

SELECT 
    column_name as "اسم العمود",
    data_type as "نوع البيانات",
    is_nullable as "يقبل NULL"
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'stores'
ORDER BY ordinal_position;

-- عينة من المتاجر
SELECT 
    '🏬 عينة من المتاجر:' as info;

SELECT 
    id,
    name,
    type,
    address,
    city,
    is_active
FROM stores
LIMIT 10;

-- ========================================
-- 4. جدول vendors (إن وجد منفصل)
-- ========================================

SELECT 
    '👥 بنية جدول vendors (إن وجد):' as info;

SELECT 
    column_name as "اسم العمود",
    data_type as "نوع البيانات",
    is_nullable as "يقبل NULL"
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'vendors'
ORDER BY ordinal_position;

-- ========================================
-- 5. جداول التوصيل الحالية
-- ========================================

SELECT 
    '🚚 الجداول المتعلقة بالتوصيل:' as info;

SELECT 
    table_name as "اسم الجدول"
FROM information_schema.tables
WHERE table_schema = 'public' 
    AND (
        table_name LIKE '%delivery%' 
        OR table_name LIKE '%shipping%'
        OR table_name LIKE '%driver%'
        OR table_name LIKE '%courier%'
    )
ORDER BY table_name;

-- ========================================
-- 6. تحليل حالات الطلبات
-- ========================================

SELECT 
    '📈 إحصائيات حالات الطلبات:' as info;

SELECT 
    status as "حالة الطلب",
    COUNT(*) as "عدد الطلبات",
    SUM(total) as "إجمالي القيمة",
    AVG(total) as "متوسط قيمة الطلب"
FROM orders
GROUP BY status
ORDER BY COUNT(*) DESC;

-- ========================================
-- 7. تحليل طلبات المطاعم vs المنتجات العادية
-- ========================================

SELECT 
    '🍽️ تحليل الطلبات حسب النوع:' as info;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM products p 
            WHERE p.vendor_id = o.vendor_id 
            AND p.category ILIKE ANY(ARRAY['%food%', '%restaurant%', '%meal%', '%مطعم%', '%وجبة%', '%طعام%'])
        ) THEN 'مطعم'
        ELSE 'منتج عادي'
    END as "نوع الطلب",
    COUNT(*) as "عدد الطلبات"
FROM orders o
GROUP BY "نوع الطلب";

-- ========================================
-- 8. معلومات عناوين التوصيل
-- ========================================

SELECT 
    '📍 تحليل مناطق التوصيل:' as info;

SELECT 
    COALESCE(
        (delivery_address->>'city'),
        (delivery_address->>'governorate'),
        'غير محدد'
    ) as "المنطقة",
    COUNT(*) as "عدد الطلبات"
FROM orders
WHERE delivery_address IS NOT NULL
GROUP BY "المنطقة"
ORDER BY COUNT(*) DESC
LIMIT 10;

-- ========================================
-- 9. جدول order_items (عناصر الطلب)
-- ========================================

SELECT 
    '📦 بنية جدول order_items:' as info;

SELECT 
    column_name as "اسم العمود",
    data_type as "نوع البيانات",
    is_nullable as "يقبل NULL"
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'order_items'
ORDER BY ordinal_position;

-- ========================================
-- 10. السائقين/الموصلين (إن وجدوا)
-- ========================================

SELECT 
    '🚗 بنية جدول drivers (إن وجد):' as info;

SELECT 
    column_name as "اسم العمود",
    data_type as "نوع البيانات",
    is_nullable as "يقبل NULL"
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'drivers'
ORDER BY ordinal_position;

-- ========================================
-- 11. جميع الجداول في قاعدة البيانات
-- ========================================

SELECT 
    '📚 جميع الجداول في قاعدة البيانات:' as info;

SELECT 
    table_name as "اسم الجدول",
    (
        SELECT COUNT(*) 
        FROM information_schema.columns c 
        WHERE c.table_name = t.table_name 
        AND c.table_schema = 'public'
    ) as "عدد الأعمدة"
FROM information_schema.tables t
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ========================================
-- 12. العلاقات بين الجداول (Foreign Keys)
-- ========================================

SELECT 
    '🔗 العلاقات بين الجداول:' as info;

SELECT 
    tc.table_name as "الجدول", 
    kcu.column_name as "العمود", 
    ccu.table_name as "الجدول المرتبط",
    ccu.column_name as "العمود المرتبط"
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ===================================================================
-- انتهى السكريبت - يرجى تشغيله في Supabase SQL Editor
-- ===================================================================
