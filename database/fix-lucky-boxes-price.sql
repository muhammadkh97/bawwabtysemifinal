-- ====================================
-- جعل price و original_value اختياريين في lucky_boxes
-- ====================================

-- السماح بـ NULL لـ price مع قيمة افتراضية
ALTER TABLE lucky_boxes 
ALTER COLUMN price DROP NOT NULL;

ALTER TABLE lucky_boxes 
ALTER COLUMN price SET DEFAULT 0;

-- السماح بـ NULL لـ original_value مع قيمة افتراضية
ALTER TABLE lucky_boxes 
ALTER COLUMN original_value DROP NOT NULL;

ALTER TABLE lucky_boxes 
ALTER COLUMN original_value SET DEFAULT 0;

-- التحقق من النتيجة
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'lucky_boxes' 
AND column_name IN ('price', 'original_value')
ORDER BY column_name;
