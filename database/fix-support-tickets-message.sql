-- ====================================
-- فحص وإصلاح جدول support_tickets
-- ====================================

-- 1. عرض جميع الأعمدة في الجدول
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'support_tickets'
ORDER BY ordinal_position;

-- 2. إضافة العمود المفقود message
ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS message TEXT;

-- 3. التحقق من النتيجة
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'support_tickets'
AND column_name = 'message';
