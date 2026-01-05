-- ====================================
-- إصلاح قيد NOT NULL على عمود description
-- ====================================
-- المشكلة: الجدول يحتوي على عمود description بقيد NOT NULL
-- لكن الكود الأمامي يرسل message بدلاً منه
-- الحل: إزالة قيد NOT NULL من description

ALTER TABLE support_tickets 
ALTER COLUMN description DROP NOT NULL;

-- التحقق من القيود
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'support_tickets'
AND column_name IN ('description', 'message')
ORDER BY column_name;
