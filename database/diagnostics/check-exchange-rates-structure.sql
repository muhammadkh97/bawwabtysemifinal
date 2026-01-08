-- ============================================
-- فحص بنية جدول exchange_rates
-- ============================================

-- 1️⃣ عرض بنية الجدول
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'exchange_rates'
ORDER BY ordinal_position;

-- 2️⃣ عرض البيانات الموجودة
SELECT * FROM exchange_rates LIMIT 10;
