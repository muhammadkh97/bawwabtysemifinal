-- ============================================
-- إضافة أعمدة العمولات والأرباح لجدول order_items
-- ============================================

-- إضافة الأعمدة المفقودة
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2) DEFAULT 10.00,
ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS vendor_earning NUMERIC(10,2);

-- إضافة تعليقات توضيحية
COMMENT ON COLUMN order_items.commission_rate IS 'نسبة عمولة المنصة (%)';
COMMENT ON COLUMN order_items.commission_amount IS 'قيمة العمولة المستحقة للمنصة';
COMMENT ON COLUMN order_items.vendor_earning IS 'ربح البائع بعد خصم العمولة';

-- التحقق من النتيجة
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'order_items'
  AND column_name IN ('commission_rate', 'commission_amount', 'vendor_earning')
ORDER BY ordinal_position;
