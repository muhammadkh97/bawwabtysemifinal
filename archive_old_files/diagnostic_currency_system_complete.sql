-- =========================================================
-- 💰 فحص شامل لنظام العملات
-- =========================================================
-- التاريخ: 2026-01-07
-- الهدف: تشخيص كامل لنظام العملات في قاعدة البيانات
-- =========================================================

SELECT '=========================================' as info;
SELECT '💰 فحص نظام العملات الشامل' as info;
SELECT '=========================================' as info;

-- =========================================================
-- 1️⃣ فحص الجداول المتعلقة بالعملات
-- =========================================================

SELECT '1️⃣ === الجداول المتعلقة بالعملات ===' as info;

SELECT 
    table_name,
    CASE 
        WHEN table_name = 'currencies' THEN '✅ جدول العملات الرئيسي'
        WHEN table_name = 'currency_rates' THEN '✅ أسعار الصرف'
        WHEN table_name = 'exchange_rates' THEN '✅ سعر الصرف التاريخي'
        ELSE '⚠️ جدول آخر'
    END as description
FROM information_schema.tables
WHERE table_schema = 'public'
    AND (
        table_name ILIKE '%currency%' OR
        table_name ILIKE '%exchange%' OR
        table_name ILIKE '%rate%'
    )
ORDER BY table_name;

-- =========================================================
-- 2️⃣ فحص أعمدة العملات في الجداول الرئيسية
-- =========================================================

SELECT '2️⃣ === أعمدة العملات في الجداول الرئيسية ===' as info;

-- جدول products
SELECT 
    'products' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'products' 
    AND (
        column_name ILIKE '%price%' OR 
        column_name ILIKE '%currency%' OR
        column_name ILIKE '%cost%'
    )
ORDER BY ordinal_position;

-- جدول orders
SELECT 
    'orders' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'orders' 
    AND (
        column_name ILIKE '%amount%' OR 
        column_name ILIKE '%total%' OR 
        column_name ILIKE '%currency%' OR
        column_name ILIKE '%price%'
    )
ORDER BY ordinal_position;

-- جدول order_items
SELECT 
    'order_items' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'order_items' 
    AND (
        column_name ILIKE '%price%' OR 
        column_name ILIKE '%amount%' OR 
        column_name ILIKE '%currency%'
    )
ORDER BY ordinal_position;

-- جدول stores
SELECT 
    'stores' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'stores' 
    AND (
        column_name ILIKE '%currency%'
    )
ORDER BY ordinal_position;

-- جدول wallets
SELECT 
    'wallets' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'wallets' 
    AND (
        column_name ILIKE '%balance%' OR 
        column_name ILIKE '%currency%' OR
        column_name ILIKE '%amount%'
    )
ORDER BY ordinal_position;

-- =========================================================
-- 3️⃣ فحص جدول currencies (إذا كان موجوداً)
-- =========================================================

SELECT '3️⃣ === تفاصيل جدول العملات ===' as info;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'currencies') THEN
        RAISE NOTICE '✅ جدول currencies موجود';
    ELSE
        RAISE NOTICE '❌ جدول currencies غير موجود';
    END IF;
END $$;

-- عرض بنية الجدول إذا كان موجوداً
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'currencies'
ORDER BY ordinal_position;

-- =========================================================
-- 4️⃣ إحصائيات البيانات
-- =========================================================

SELECT '4️⃣ === إحصائيات بيانات العملات ===' as info;

-- إحصائيات المنتجات
SELECT 
    '📊 إجمالي المنتجات' as indicator,
    COUNT(*) as count
FROM products
UNION ALL
SELECT 
    '💵 منتجات لها سعر',
    COUNT(*)
FROM products
WHERE price IS NOT NULL;

-- إحصائيات الطلبات
SELECT 
    '📊 إجمالي الطلبات' as indicator,
    COUNT(*) as count
FROM orders
UNION ALL
SELECT 
    '💰 طلبات لها مبلغ إجمالي',
    COUNT(*)
FROM orders
WHERE total_amount IS NOT NULL;

-- فحص العملات المستخدمة في المنتجات
SELECT '💱 العملات المستخدمة في products:' as info;
SELECT 
    COALESCE(currency, 'NULL') as currency_code,
    COUNT(*) as product_count,
    AVG(price) as avg_price,
    MIN(price) as min_price,
    MAX(price) as max_price
FROM products
GROUP BY currency
ORDER BY product_count DESC;

-- فحص العملات في الطلبات
SELECT '💱 العملات المستخدمة في orders:' as info;
SELECT 
    COALESCE(currency, 'NULL') as currency_code,
    COUNT(*) as order_count,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_order_value
FROM orders
GROUP BY currency
ORDER BY order_count DESC;

-- =========================================================
-- 5️⃣ فحص أسعار الصرف
-- =========================================================

SELECT '5️⃣ === أسعار الصرف ===' as info;

-- فحص وجود جدول أسعار الصرف
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exchange_rates') THEN
        RAISE NOTICE '✅ جدول exchange_rates موجود';
    ELSE
        RAISE NOTICE '❌ جدول exchange_rates غير موجود';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'currency_rates') THEN
        RAISE NOTICE '✅ جدول currency_rates موجود';
    ELSE
        RAISE NOTICE '❌ جدول currency_rates غير موجود';
    END IF;
END $$;

-- =========================================================
-- 6️⃣ فحص Functions المتعلقة بالعملات
-- =========================================================

SELECT '6️⃣ === Functions المتعلقة بالعملات ===' as info;

SELECT 
    routine_name,
    routine_type,
    data_type as return_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND (
        routine_name ILIKE '%currency%' OR
        routine_name ILIKE '%exchange%' OR
        routine_name ILIKE '%convert%' OR
        routine_name ILIKE '%rate%'
    )
ORDER BY routine_name;

-- =========================================================
-- 7️⃣ فحص Constraints على العملات
-- =========================================================

SELECT '7️⃣ === Constraints على أعمدة العملات ===' as info;

SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
    AND (
        tc.constraint_name ILIKE '%currency%' OR
        tc.constraint_name ILIKE '%price%' OR
        tc.constraint_name ILIKE '%amount%'
    )
ORDER BY tc.table_name;

-- =========================================================
-- 8️⃣ فحص Indexes على العملات
-- =========================================================

SELECT '8️⃣ === Indexes على أعمدة العملات ===' as info;

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND (
        indexdef ILIKE '%currency%' OR
        indexdef ILIKE '%price%'
    )
ORDER BY tablename, indexname;

-- =========================================================
-- 9️⃣ فحص Triggers المتعلقة بالعملات
-- =========================================================

SELECT '9️⃣ === Triggers المتعلقة بالعملات ===' as info;

SELECT 
    trigger_name,
    event_object_table as table_name,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
    AND (
        trigger_name ILIKE '%currency%' OR
        trigger_name ILIKE '%price%' OR
        trigger_name ILIKE '%exchange%'
    )
ORDER BY event_object_table, trigger_name;

-- =========================================================
-- 🔟 فحص العملة الافتراضية
-- =========================================================

SELECT '🔟 === العملة الافتراضية ===' as info;

-- فحص المنتجات بدون عملة
SELECT 
    'منتجات بدون عملة محددة' as issue,
    COUNT(*) as count
FROM products
WHERE currency IS NULL;

-- فحص الطلبات بدون عملة
SELECT 
    'طلبات بدون عملة محددة' as issue,
    COUNT(*) as count
FROM orders
WHERE currency IS NULL;

-- =========================================================
-- 1️⃣1️⃣ فحص تناسق الأسعار
-- =========================================================

SELECT '1️⃣1️⃣ === تحليل تناسق الأسعار ===' as info;

-- المنتجات بأسعار سالبة أو صفر
SELECT 
    'منتجات بسعر <= 0' as issue,
    COUNT(*) as count
FROM products
WHERE price IS NOT NULL AND price <= 0;

-- الطلبات بمبالغ سالبة
SELECT 
    'طلبات بمبلغ سالب' as issue,
    COUNT(*) as count
FROM orders
WHERE total_amount IS NOT NULL AND total_amount < 0;

-- =========================================================
-- 1️⃣2️⃣ فحص الدعم متعدد العملات
-- =========================================================

SELECT '1️⃣2️⃣ === دعم العملات المتعددة ===' as info;

-- عدد العملات المختلفة في النظام
SELECT 
    'عدد العملات المستخدمة' as metric,
    COUNT(DISTINCT currency) as count
FROM (
    SELECT currency FROM products WHERE currency IS NOT NULL
    UNION
    SELECT currency FROM orders WHERE currency IS NOT NULL
) currencies;

-- =========================================================
-- 1️⃣3️⃣ عينة من البيانات
-- =========================================================

SELECT '1️⃣3️⃣ === عينة من بيانات الأسعار ===' as info;

-- عينة من المنتجات
SELECT 
    id,
    LEFT(name, 30) as product_name,
    price,
    COALESCE(currency, 'NULL') as currency,
    store_id
FROM products
WHERE price IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;

-- عينة من الطلبات
SELECT 
    id,
    total_amount,
    COALESCE(currency, 'NULL') as currency,
    status,
    created_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;

-- =========================================================
-- 1️⃣4️⃣ ملخص التشخيص
-- =========================================================

SELECT '=========================================' as info;
SELECT '📋 ملخص تشخيص نظام العملات' as info;
SELECT '=========================================' as info;

DO $$ 
DECLARE
    v_products_count INTEGER;
    v_products_with_price INTEGER;
    v_products_with_currency INTEGER;
    v_products_no_currency INTEGER;
    v_orders_count INTEGER;
    v_orders_with_currency INTEGER;
    v_currencies_count INTEGER;
    v_has_currencies_table BOOLEAN;
    v_has_exchange_rates_table BOOLEAN;
    v_functions_count INTEGER;
BEGIN
    -- إحصائيات المنتجات
    SELECT COUNT(*) INTO v_products_count FROM products;
    SELECT COUNT(*) INTO v_products_with_price FROM products WHERE price IS NOT NULL;
    SELECT COUNT(*) INTO v_products_with_currency FROM products WHERE currency IS NOT NULL;
    SELECT COUNT(*) INTO v_products_no_currency FROM products WHERE price IS NOT NULL AND currency IS NULL;
    
    -- إحصائيات الطلبات
    SELECT COUNT(*) INTO v_orders_count FROM orders;
    SELECT COUNT(*) INTO v_orders_with_currency FROM orders WHERE currency IS NOT NULL;
    
    -- عدد العملات
    SELECT COUNT(DISTINCT currency) INTO v_currencies_count
    FROM (
        SELECT currency FROM products WHERE currency IS NOT NULL
        UNION
        SELECT currency FROM orders WHERE currency IS NOT NULL
    ) currencies;
    
    -- فحص الجداول
    SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'currencies') 
    INTO v_has_currencies_table;
    
    SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name IN ('exchange_rates', 'currency_rates')) 
    INTO v_has_exchange_rates_table;
    
    -- عدد الدوال
    SELECT COUNT(*) INTO v_functions_count
    FROM information_schema.routines
    WHERE routine_schema = 'public'
        AND (routine_name ILIKE '%currency%' OR routine_name ILIKE '%exchange%' OR routine_name ILIKE '%convert%');
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '💰 ملخص نظام العملات';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 الإحصائيات:';
    RAISE NOTICE '   - إجمالي المنتجات: %', v_products_count;
    RAISE NOTICE '   - منتجات لها سعر: %', v_products_with_price;
    RAISE NOTICE '   - منتجات لها عملة: %', v_products_with_currency;
    RAISE NOTICE '   - منتجات بدون عملة: %', v_products_no_currency;
    RAISE NOTICE '   - إجمالي الطلبات: %', v_orders_count;
    RAISE NOTICE '   - طلبات لها عملة: %', v_orders_with_currency;
    RAISE NOTICE '   - عدد العملات المستخدمة: %', v_currencies_count;
    RAISE NOTICE '';
    RAISE NOTICE '🏗️ البنية التحتية:';
    RAISE NOTICE '   - جدول currencies: %', CASE WHEN v_has_currencies_table THEN '✅ موجود' ELSE '❌ غير موجود' END;
    RAISE NOTICE '   - جدول exchange_rates: %', CASE WHEN v_has_exchange_rates_table THEN '✅ موجود' ELSE '❌ غير موجود' END;
    RAISE NOTICE '   - عدد Functions: %', v_functions_count;
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ المشاكل المحتملة:';
    
    IF v_products_no_currency > 0 THEN
        RAISE NOTICE '   ❌ % منتج لديه سعر بدون عملة محددة', v_products_no_currency;
    END IF;
    
    IF NOT v_has_currencies_table THEN
        RAISE NOTICE '   ❌ جدول العملات غير موجود';
    END IF;
    
    IF NOT v_has_exchange_rates_table THEN
        RAISE NOTICE '   ⚠️ لا يوجد جدول لأسعار الصرف';
    END IF;
    
    IF v_functions_count = 0 THEN
        RAISE NOTICE '   ⚠️ لا توجد functions لتحويل العملات';
    END IF;
    
    IF v_currencies_count = 1 THEN
        RAISE NOTICE '   ℹ️ النظام يستخدم عملة واحدة فقط';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ التوصيات:';
    
    IF NOT v_has_currencies_table THEN
        RAISE NOTICE '   1. إنشاء جدول currencies رئيسي';
    END IF;
    
    IF NOT v_has_exchange_rates_table THEN
        RAISE NOTICE '   2. إنشاء جدول exchange_rates لأسعار الصرف';
    END IF;
    
    IF v_products_no_currency > 0 THEN
        RAISE NOTICE '   3. تعيين عملة افتراضية للمنتجات';
    END IF;
    
    IF v_functions_count = 0 THEN
        RAISE NOTICE '   4. إنشاء functions لتحويل العملات';
    END IF;
    
    RAISE NOTICE '   5. إضافة دعم متعدد العملات كامل';
    RAISE NOTICE '   6. إنشاء API لتحديث أسعار الصرف تلقائياً';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
