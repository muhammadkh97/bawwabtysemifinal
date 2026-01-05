-- ============================================
-- إضافة حقل rejection_reason لجدول products
-- ============================================

-- إضافة حقل rejection_reason إن لم يكن موجوداً
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- التحقق
SELECT 
  '✅ تم إضافة حقل rejection_reason' AS الحالة,
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name = 'rejection_reason'
    ) THEN 'موجود الآن ✅'
    ELSE 'غير موجود ❌'
  END AS الحقل;
