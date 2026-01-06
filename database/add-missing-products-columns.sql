-- ============================================
-- إضافة الأعمدة المفقودة في جدول products
-- Add Missing Columns to Products Table
-- ============================================

-- ========== 1. إضافة عمود description_ar ==========

ALTER TABLE products
ADD COLUMN IF NOT EXISTS description_ar TEXT;

COMMENT ON COLUMN products.description_ar IS 'الوصف بالعربية';

-- ========== 2. إضافة عمود sale_price ==========

ALTER TABLE products
ADD COLUMN IF NOT EXISTS sale_price NUMERIC;

COMMENT ON COLUMN products.sale_price IS 'سعر التخفيض - إذا كان أقل من السعر الأساسي يظهر كتخفيض';

-- ========== 3. التحقق من إضافة الأعمدة ==========

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
AND column_name IN ('description_ar', 'sale_price')
ORDER BY column_name;

-- ✅ تم إضافة الأعمدة المفقودة
