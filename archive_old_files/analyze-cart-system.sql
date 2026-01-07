-- ===================================================================
-- تحليل نظام السلة الحالي
-- ===================================================================

-- 1. بنية جدول cart_items
SELECT 
    '🛒 بنية cart_items:' as info;

SELECT 
    column_name as "العمود",
    data_type as "النوع",
    is_nullable as "NULL"
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'cart_items'
ORDER BY ordinal_position;

-- 2. عينة من السلة
SELECT 
    '📦 عينة من السلة:' as info;

SELECT 
    ci.*,
    p.name as product_name,
    s.business_type as vendor_business_type
FROM cart_items ci
LEFT JOIN products p ON ci.product_id = p.id
LEFT JOIN stores s ON p.vendor_id = s.id
LIMIT 5;

-- 3. تحليل المنتجات في السلة حسب نوع البائع
SELECT 
    '📊 تحليل حسب نوع البائع:' as info;

SELECT 
    s.business_type as "نوع البائع",
    COUNT(ci.id) as "عدد المنتجات في السلة"
FROM cart_items ci
JOIN products p ON ci.product_id = p.id
JOIN stores s ON p.vendor_id = s.id
GROUP BY s.business_type;

-- 4. هل يوجد جدول sessions أو user_carts؟
SELECT 
    '🔍 جداول مرتبطة بالسلة:' as info;

SELECT 
    table_name as "اسم الجدول"
FROM information_schema.tables
WHERE table_schema = 'public' 
    AND (
        table_name LIKE '%cart%' 
        OR table_name LIKE '%session%'
        OR table_name LIKE '%basket%'
    )
ORDER BY table_name;

-- 5. كيف يتم التعرف على السلة (user_id أم session؟)
SELECT 
    '👤 طريقة التعرف على السلة:' as info;

SELECT DISTINCT
    CASE 
        WHEN user_id IS NOT NULL THEN 'بواسطة user_id'
        ELSE 'بدون user_id'
    END as "طريقة التعرف"
FROM cart_items;

-- 6. العلاقات مع cart_items
SELECT 
    '🔗 علاقات cart_items:' as info;

SELECT 
    tc.table_name as "الجدول", 
    kcu.column_name as "العمود", 
    ccu.table_name as "الجدول المرتبط"
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'cart_items';
