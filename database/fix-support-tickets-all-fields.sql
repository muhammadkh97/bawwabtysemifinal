-- ====================================
-- إضافة جميع الأعمدة المفقودة لجدول support_tickets
-- ====================================

-- إضافة user_phone
ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS user_phone TEXT;

-- إضافة subject (الموضوع)
ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS subject TEXT;

-- التحقق من جميع الأعمدة المضافة
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'support_tickets'
AND column_name IN ('message', 'user_email', 'user_name', 'user_phone', 'subject')
ORDER BY column_name;
