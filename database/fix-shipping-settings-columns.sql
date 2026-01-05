-- ====================================
-- فحص وإصلاح جدول shipping_settings
-- ====================================

-- 1. عرض جميع الأعمدة في الجدول
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'shipping_settings'
ORDER BY ordinal_position;

-- 2. إضافة العمود المفقود is_free
ALTER TABLE shipping_settings 
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;

-- 3. التحقق من النتيجة
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'shipping_settings'
AND column_name = 'is_free';
