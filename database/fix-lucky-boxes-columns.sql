-- ====================================
-- إضافة الأعمدة المفقودة لجدول lucky_boxes
-- ====================================

-- إضافة icon (أيقونة الصندوق)
ALTER TABLE lucky_boxes 
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'Gift';

-- إضافة gradient (تدرج لوني للعرض)
ALTER TABLE lucky_boxes 
ADD COLUMN IF NOT EXISTS gradient TEXT DEFAULT 'from-purple-500 to-pink-500';

-- إضافة total_points (إجمالي النقاط)
ALTER TABLE lucky_boxes 
ADD COLUMN IF NOT EXISTS total_points INTEGER DEFAULT 0;

-- إضافة max_winners (الحد الأقصى للفائزين)
ALTER TABLE lucky_boxes 
ADD COLUMN IF NOT EXISTS max_winners INTEGER DEFAULT 10;

-- إضافة min_points (الحد الأدنى للنقاط)
ALTER TABLE lucky_boxes 
ADD COLUMN IF NOT EXISTS min_points INTEGER DEFAULT 10;

-- إضافة max_points (الحد الأقصى للنقاط)
ALTER TABLE lucky_boxes 
ADD COLUMN IF NOT EXISTS max_points INTEGER DEFAULT 100;

-- التحقق من النتيجة
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'lucky_boxes'
AND column_name IN ('icon', 'gradient', 'total_points', 'max_winners', 'min_points', 'max_points')
ORDER BY column_name;
