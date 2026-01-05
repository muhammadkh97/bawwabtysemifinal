-- ====================================
-- إصلاح جدول disputes - إضافة الأعمدة المفقودة
-- ====================================

-- ========== 1. إضافة عمود type ==========

-- إضافة عمود نوع النزاع
ALTER TABLE disputes 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'other';

-- إضافة comment للتوضيح
COMMENT ON COLUMN disputes.type IS 'نوع النزاع: not_received, damaged, wrong_item, other';

-- ========== 2. إضافة عمود amount ==========

-- إضافة عمود المبلغ المتنازع عليه
ALTER TABLE disputes 
ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2) DEFAULT 0;

-- إضافة comment للتوضيح
COMMENT ON COLUMN disputes.amount IS 'المبلغ المتنازع عليه بالشيكل';

-- ========== 3. التحقق من الإضافة ==========

-- عرض جميع أعمدة جدول disputes بعد التعديل
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'disputes'
ORDER BY ordinal_position;

-- ========== 4. إحصائيات بعد الإصلاح ==========

SELECT 
  COUNT(*) as total_disputes,
  COUNT(CASE WHEN status = 'open' THEN 1 END) as open_disputes,
  COUNT(CASE WHEN status = 'investigating' THEN 1 END) as investigating,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved,
  COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed,
  SUM(CASE WHEN amount IS NOT NULL THEN amount ELSE 0 END) as total_amount,
  COUNT(CASE WHEN type = 'not_received' THEN 1 END) as not_received_count,
  COUNT(CASE WHEN type = 'damaged' THEN 1 END) as damaged_count,
  COUNT(CASE WHEN type = 'wrong_item' THEN 1 END) as wrong_item_count,
  COUNT(CASE WHEN type = 'other' THEN 1 END) as other_count
FROM disputes;

-- ========== 5. ملخص النتائج ==========

SELECT 
  'Disputes Table Fixed' as status,
  json_build_object(
    'type_column_exists', EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'disputes' AND column_name = 'type'
    ),
    'amount_column_exists', EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'disputes' AND column_name = 'amount'
    ),
    'total_disputes', (SELECT COUNT(*) FROM disputes),
    'columns_count', (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'disputes')
  ) as summary;
