-- ===================================================================
-- استخراج بنية جدول orders بشكل صحيح
-- ===================================================================

SELECT 
    '📦 بنية جدول orders الكاملة:' as info;

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
    '📋 أول 3 طلبات:' as info;

SELECT *
FROM orders
ORDER BY created_at DESC
LIMIT 3;

-- تحليل أنواع البائعين
SELECT 
    '🏪 أنواع البائعين في vendors:' as info;

SELECT DISTINCT
    business_type,
    vendor_type,
    COUNT(*) as count
FROM vendors
WHERE is_active = true
GROUP BY business_type, vendor_type;

-- عينة من stores
SELECT 
    '🏬 بنية جدول stores:' as info;

SELECT 
    column_name as "اسم العمود",
    data_type as "نوع البيانات",
    is_nullable as "يقبل NULL"
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'stores'
ORDER BY ordinal_position;

-- تحليل المنتجات مع الفئات
SELECT 
    '📊 تحليل المنتجات مع الفئات:' as info;

SELECT 
    c.name as "الفئة",
    c.name_ar as "الفئة بالعربية",
    COUNT(p.id) as "عدد المنتجات"
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.is_active = true
GROUP BY c.id, c.name, c.name_ar
ORDER BY COUNT(p.id) DESC;

-- تحليل shipping_settings
SELECT 
    '🚚 بنية جدول shipping_settings:' as info;

SELECT 
    column_name as "اسم العمود",
    data_type as "نوع البيانات",
    is_nullable as "يقبل NULL"
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'shipping_settings'
ORDER BY ordinal_position;

SELECT 
    '⚙️ محتويات shipping_settings:' as info;

SELECT *
FROM shipping_settings;
