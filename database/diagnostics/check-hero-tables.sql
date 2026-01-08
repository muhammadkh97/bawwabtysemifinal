-- ============================================
-- سكريبت فحص جداول Hero وأسعار الصرف
-- ============================================

-- 1️⃣ فحص جميع الجداول المتعلقة بـ Hero
SELECT 
    tablename,
    schemaname
FROM pg_tables
WHERE tablename LIKE '%hero%'
ORDER BY tablename;

-- 2️⃣ عرض بنية جدول hero_sections إذا كان موجوداً
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'hero_sections'
ORDER BY ordinal_position;

-- 3️⃣ عرض البيانات الموجودة في hero_sections
SELECT * FROM hero_sections LIMIT 5;

-- 4️⃣ فحص جدول exchange_rates
SELECT 
    from_currency,
    to_currency,
    rate,
    last_updated
FROM exchange_rates
WHERE (from_currency = 'SAR' AND to_currency = 'ILS')
   OR (from_currency = 'ILS' AND to_currency = 'SAR')
ORDER BY last_updated DESC;

-- 5️⃣ عرض جميع أسعار الصرف المتاحة
SELECT 
    from_currency,
    to_currency,
    rate,
    last_updated
FROM exchange_rates
ORDER BY from_currency, to_currency;
