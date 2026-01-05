-- ====================================
-- فحص جدول lucky_boxes
-- ====================================

-- 1. عرض جميع الأعمدة في الجدول
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'lucky_boxes'
ORDER BY ordinal_position;

-- 2. عرض البيانات الموجودة
SELECT * FROM lucky_boxes LIMIT 5;
