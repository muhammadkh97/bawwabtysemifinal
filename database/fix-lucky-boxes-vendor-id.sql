-- ====================================
-- جعل vendor_id اختياري في lucky_boxes
-- ====================================

-- السماح بـ NULL لـ vendor_id (للصناديق التي يضيفها المدير)
ALTER TABLE lucky_boxes 
ALTER COLUMN vendor_id DROP NOT NULL;

-- تعيين قيمة افتراضية NULL
ALTER TABLE lucky_boxes 
ALTER COLUMN vendor_id SET DEFAULT NULL;

-- التحقق من النتيجة
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'lucky_boxes' AND column_name = 'vendor_id';
