-- ====================================
-- إضافة user_email و user_name لجدول support_tickets
-- ====================================

-- إضافة user_email
ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- إضافة user_name (قد يكون مطلوب أيضاً)
ALTER TABLE support_tickets 
ADD COLUMN IF NOT EXISTS user_name TEXT;

-- التحقق من النتيجة
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'support_tickets'
AND column_name IN ('user_email', 'user_name', 'message')
ORDER BY column_name;
