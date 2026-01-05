-- ====================================
-- فحص جدول loyalty_settings
-- ====================================

-- 1. عرض جميع الأعمدة في الجدول
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'loyalty_settings'
ORDER BY ordinal_position;

-- 2. عرض البيانات الموجودة
SELECT * FROM loyalty_settings LIMIT 5;
