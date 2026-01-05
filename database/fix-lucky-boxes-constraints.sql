-- ====================================
-- إزالة check constraints على price و original_value
-- ====================================

-- البحث عن الـ constraints الموجودة
SELECT 
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'lucky_boxes'
AND cc.check_clause LIKE '%price%';

-- إزالة constraint positive_price
ALTER TABLE lucky_boxes 
DROP CONSTRAINT IF EXISTS positive_price;

-- إزالة أي constraint على original_value
ALTER TABLE lucky_boxes 
DROP CONSTRAINT IF EXISTS positive_original_value;

-- التحقق من النتيجة
SELECT 
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'lucky_boxes';
