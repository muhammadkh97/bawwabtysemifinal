-- ===================================================================
-- فحص شامل لنظام العملات الحالي
-- ===================================================================

-- 1. فحص جدول products - الأعمدة المتعلقة بالعملة
SELECT 
    '💰 أعمدة العملة في جدول PRODUCTS:' as info;

SELECT 
    column_name as "اسم العمود",
    data_type as "نوع البيانات",
    CASE 
        WHEN is_nullable = 'YES' THEN '✅ نعم'
        ELSE '❌ لا'
    END as "يقبل NULL؟",
    column_default as "القيمة الافتراضية"
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'products'
    AND column_name IN ('price', 'old_price', 'original_currency')
ORDER BY ordinal_position;

-- ===================================================================

-- 2. فحص جدول exchange_rates
SELECT 
    '💱 فحص جدول EXCHANGE_RATES:' as info;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
                AND table_name = 'exchange_rates'
        ) THEN '✅ موجود'
        ELSE '❌ غير موجود - يجب إنشاؤه'
    END as "جدول exchange_rates";

-- ===================================================================

-- 3. عرض بنية جدول exchange_rates إذا كان موجوداً
SELECT 
    '📊 أعمدة جدول EXCHANGE_RATES (إن وجد):' as info;

SELECT 
    column_name as "اسم العمود",
    data_type as "نوع البيانات",
    CASE 
        WHEN is_nullable = 'YES' THEN '✅ نعم'
        ELSE '❌ لا'
    END as "يقبل NULL؟"
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'exchange_rates'
ORDER BY ordinal_position;

-- ===================================================================

-- 4. فحص البيانات الموجودة في exchange_rates (إن وجدت)
SELECT 
    '💵 أسعار الصرف الموجودة:' as info;

SELECT 
    from_currency as "من عملة",
    to_currency as "إلى عملة",
    rate as "سعر الصرف",
    last_updated as "آخر تحديث"
FROM exchange_rates
ORDER BY from_currency, to_currency
LIMIT 20;

-- ===================================================================

-- 5. فحص جدول users - هل يوجد عمود للعملة المفضلة؟
SELECT 
    '👤 عمود العملة في جدول USERS:' as info;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
                AND table_name = 'users' 
                AND column_name = 'preferred_currency'
        ) THEN '✅ موجود'
        ELSE '❌ غير موجود - يجب إضافته'
    END as "عمود preferred_currency";

-- ===================================================================

-- 6. فحص جدول currencies (العملات المدعومة)
SELECT 
    '🌐 فحص جدول CURRENCIES:' as info;

SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
                AND table_name = 'currencies'
        ) THEN '✅ موجود'
        ELSE '❌ غير موجود - يجب إنشاؤه'
    END as "جدول currencies";

-- ===================================================================

-- 7. عرض بيانات عينة من products
SELECT 
    '🛍️ عينة من المنتجات وعملاتها:' as info;

SELECT 
    id,
    name,
    price,
    old_price,
    original_currency,
    created_at
FROM products
LIMIT 5;

-- ===================================================================
-- ✅ انتهى الفحص
-- ===================================================================
